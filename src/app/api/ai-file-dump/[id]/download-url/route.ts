/**
 * API Route for getting a signed download URL for a file
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/server/supabase";
import { getSignedUrl } from "@/lib/s3";

// Create a server-side Supabase client
interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET - Get a signed URL for downloading/previewing a file
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Get the record to find the S3 key
    const { data: record, error: fetchError } = await supabase
      .from("files")
      .select("file_link, file_name")
      .eq("id", id)
      .single();

    if (fetchError || !record) {
      console.error("Record not found:", fetchError);
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Generate signed URL
    const url = await getSignedUrl(record.file_link);

    return NextResponse.json({
      success: true,
      url,
      fileName: record.file_name,
    });
  } catch (error) {
    console.error("Get download URL error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to get download URL" },
      { status: 500 }
    );
  }
}
