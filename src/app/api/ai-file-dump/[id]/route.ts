/**
 * API Route for individual file operations
 * Handles DELETE requests for specific files
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/server/supabase";
import { deleteFile } from "@/lib/s3";

// Create a server-side Supabase client
interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE - Remove a file record
 * Deletes both the S3 file and the database record
 */
export async function DELETE(
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

    // First, get the record to find the S3 key
    const { data: record, error: fetchError } = await supabase
      .from("files")
      .select("file_link")
      .eq("id", id)
      .single();

    if (fetchError || !record) {
      console.error("Record not found:", fetchError);
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Delete from S3
    try {
      await deleteFile(record.file_link);
    } catch (s3Error) {
      console.error("S3 delete error:", s3Error);
      // Continue with database deletion even if S3 fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("files")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Database delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete file record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to delete file" },
      { status: 500 }
    );
  }
}
