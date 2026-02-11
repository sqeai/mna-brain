/**
 * API Route for AI File Dump
 * Handles POST (upload) and GET (list) requests for file dumps
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadFile, getSignedUrl, generateMeetingNoteKey, downloadFile } from "@/lib/s3";
import { extractTextFromFile } from "@/lib/fileExtractor";
import { processFileContent } from "@/lib/file_processing_agent";

// Create a server-side Supabase client
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(url, key);
}

/**
 * POST - Upload a new file
 */
export async function POST(request: NextRequest) {
  try {
    const { key, fileName, contentType, raw_notes: userRawNotes } = await request.json();

    if (!key || !fileName) {
      return NextResponse.json(
        { error: "key and fileName are required" },
        { status: 400 }
      );
    }

    // Download file content from S3
    const buffer = await downloadFile(key);
    const s3Key = key;
    const fileType = contentType || "application/octet-stream";

    const supabase = getSupabaseClient();

    // Initial insert with 'processing' status
    const { data: initialData, error: insertError } = await supabase
      .from("files")
      .insert({
        file_name: fileName,
        file_link: s3Key,
        processing_status: 'processing',
        file_type: 'other'
      })
      .select()
      .single();

    if (insertError || !initialData) {
      console.error("Database insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create file record" },
        { status: 500 }
      );
    }

    // Process file in the background (or continue in-thread for now)
    // In a production app, this would be a background job
    let rawText = "";
    let structuredResult = null;
    let tags: string[] = [];
    let matched_companies: any[] = [];

    try {
      // 1. Extract raw text from supported formats (skip for PDFs)
      const isPdf = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        rawText = await extractTextFromFile(buffer, fileType, fileName);
      }

      // 2. Invoke the agent to structure the text
      structuredResult = await processFileContent(rawText, buffer, fileType, userRawNotes);

      if (structuredResult) {
        tags = structuredResult.tags || [];
        matched_companies = structuredResult.matched_companies || [];
      }

      // 3. Update the record with full technical results
      await supabase
        .from("files")
        .update({
          raw_notes: rawText,
          file_type: structuredResult?.file_type || 'other',
          structured_notes: structuredResult ? JSON.stringify(structuredResult, null, 2) : null,
          tags: tags,
          matched_companies: matched_companies,
          file_date: structuredResult?.file_date || null,
          processing_status: 'completed'
        })
        .eq('id', initialData.id);

    } catch (processError) {
      console.error("Error during file processing:", processError);
      await supabase
        .from("files")
        .update({
          processing_status: 'failed',
          raw_notes: rawText || "Extraction failed"
        })
        .eq('id', initialData.id);
    }

    // Fetch the updated record
    const { data: updatedData } = await supabase
      .from("files")
      .select("*")
      .eq('id', initialData.id)
      .single();

    const signedUrl = await getSignedUrl(s3Key);

    return NextResponse.json({
      success: true,
      data: {
        ...updatedData,
        signed_url: signedUrl,
      },
    });
  } catch (error) {
    console.error("Upload file error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to upload file" },
      { status: 500 }
    );
  }
}

/**
 * GET - List all files with signed URLs
 */
export async function GET(request: NextRequest) {
  try {
    const fileType = request.nextUrl.searchParams.get("file_type");

    const supabase = getSupabaseClient();
    let query = supabase
      .from("files")
      .select("*");

    if (fileType) {
      query = query.eq("file_type", fileType);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Database query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      );
    }

    // Generate signed URLs for all files
    const notesWithUrls = await Promise.all(
      (data || []).map(async (note) => {
        try {
          const signedUrl = await getSignedUrl(note.file_link);
          return {
            ...note,
            signed_url: signedUrl,
          };
        } catch (urlError) {
          console.error(`Error generating signed URL for ${note.file_link}:`, urlError);
          return {
            ...note,
            signed_url: null,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: notesWithUrls,
    });
  } catch (error) {
    console.error("Fetch files error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch files" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update a file record
 */
export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("files")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database update error:", error);
      return NextResponse.json(
        { error: "Failed to update file record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Update file error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to update file record" },
      { status: 500 }
    );
  }
}
