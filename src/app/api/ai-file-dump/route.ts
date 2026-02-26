/**
 * API Route for AI File Dump
 * Handles POST (upload) and GET (list) requests for file dumps
 */
import { extractTextFromFile } from "@/lib/fileExtractor";
import { processFileContent } from "@/lib/file_processing_agent";
import { downloadFile, getSignedUrl } from "@/lib/s3";
import { createSupabaseClient } from "@/lib/server/supabase";
import { NextRequest, NextResponse } from "next/server";

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

    const supabase = createSupabaseClient();

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
      structuredResult = await processFileContent(rawText, buffer, fileType, userRawNotes, supabase);

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

    const company = structuredResult.company;
    if (!company || !company.id) {
      return await responseSuccess(s3Key, updatedData);
    }

    const { error: companyAnalysisInsertError } = await supabase
      .from("company_analyses")
      .insert({
        company_id: company.id,
        status: "generating",
      });
    if (companyAnalysisInsertError) {
      console.error('Error inserting company_analyses results:', companyAnalysisInsertError);
    }

    // Trigger company analysis and market screening in the background
    const baseUrl = request.nextUrl.origin;

    // Call company-analysis endpoint to generate analysis for the matched company
    fetch(`${baseUrl}/api/company-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: company.id, source : structuredResult?.file_type || 'other'}),
    }).catch((err) => {
      console.error('Error triggering company analysis:', err);
    });

    // Call ai-screening endpoint to execute screening for the company against all criteria
    (async () => {
      try {
        // Fetch all screening criteria
        const { data: criteriaList, error: criteriaError } = await supabase
          .from('criterias')
          .select('id, name, prompt')
          .order('created_at', { ascending: true });

        if (criteriaError || !criteriaList || criteriaList.length === 0) {
          console.log('No screening criteria found, skipping ai-screening');
          return;
        }

        // Build company data for screening
        const companyData = {
          id: company.id,
          name: company.target || company.name,
          segment: company.segment,
          geography: company.geography,
          company_focus: company.company_focus,
          ownership: company.ownership,
          website: company.website,
          revenue_2022_usd_mn: company.revenue_2022_usd_mn,
          revenue_2023_usd_mn: company.revenue_2023_usd_mn,
          revenue_2024_usd_mn: company.revenue_2024_usd_mn,
          ebitda_2022_usd_mn: company.ebitda_2022_usd_mn,
          ebitda_2023_usd_mn: company.ebitda_2023_usd_mn,
          ebitda_2024_usd_mn: company.ebitda_2024_usd_mn,
          ev_2024: company.ev_2024,
        };

        // Create screening entries and trigger AI screening for each criterion
        for (const criterion of criteriaList) {
          // Insert screening entry with 'pending' state
          const { data: screeningEntry, error: insertError } = await supabase
            .from('screenings')
            .insert({
              company_id: company.id,
              criteria_id: criterion.id,
              state: 'pending',
            })
            .select()
            .single();

          if (insertError) {
            console.error(`Error creating screening entry for criterion ${criterion.id}:`, insertError);
            continue;
          }

          // Call ai-screening endpoint
          fetch(`${baseUrl}/api/ai-screening`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyId: company.id,
              criteriaId: criterion.id,
              criteriaPrompt: criterion.prompt,
              company: companyData,
            }),
          })
            .then(async (response) => {
              const data = await response.json();
              const newState = data.result === 'error' ? 'failed' : 'completed';
              await supabase
                .from('screenings')
                .update({
                  state: newState,
                  result: data.result,
                  remarks: data.remarks,
                })
                .eq('id', screeningEntry.id);
            })
            .catch((err) => {
              console.error(`Error triggering ai-screening for criterion ${criterion.id}:`, err);
              supabase
                .from('screenings')
                .update({
                  state: 'failed',
                  result: 'error',
                  remarks: 'API call failed',
                })
                .eq('id', screeningEntry.id);
            });
        }
      } catch (err) {
        console.error('Error in ai-screening flow:', err);
      }
    })();

    return await responseSuccess(s3Key, updatedData);
  } catch (error) {
    console.error("Upload file error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to upload file" },
      { status: 500 }
    );
  }

  async function responseSuccess(s3Key: any, updatedData: any) {
    const signedUrl = await getSignedUrl(s3Key);

    return NextResponse.json({
      success: true,
      data: {
        ...updatedData,
        signed_url: signedUrl,
      },
    });
  }
}

/**
 * GET - List all files with signed URLs
 */
export async function GET(request: NextRequest) {
  try {
    const fileType = request.nextUrl.searchParams.get("file_type");

    const supabase = createSupabaseClient();
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

    const supabase = createSupabaseClient();
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
