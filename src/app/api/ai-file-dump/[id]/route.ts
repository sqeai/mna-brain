/**
 * API Route for individual file operations
 * Handles DELETE requests for specific files
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/server/supabase";
import { FileRepository } from "@/lib/repositories";
import { deleteFile } from "@/lib/s3";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE - Remove a file record
 * Deletes both the S3 file and the database record
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    const db = createSupabaseClient();
    const fileRepo = new FileRepository(db);

    const record = await fileRepo.findLinkAndNameById(id);

    try {
      await deleteFile(record.file_link);
    } catch (s3Error) {
      console.error("S3 delete error:", s3Error);
      // Continue with DB deletion even if S3 fails
    }

    await fileRepo.delete(id);

    return NextResponse.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to delete file" },
      { status: 500 },
    );
  }
}
