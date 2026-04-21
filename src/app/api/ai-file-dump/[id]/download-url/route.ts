/**
 * API Route for getting a signed download URL for a file
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/server/supabase";
import { FileRepository } from "@/lib/repositories";
import { getSignedUrl } from "@/lib/s3";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET - Get a signed URL for downloading/previewing a file
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    const db = createSupabaseClient();
    const fileRepo = new FileRepository(db);

    const record = await fileRepo.findLinkAndNameById(id);
    const url = await getSignedUrl(record.file_link);

    return NextResponse.json({ success: true, url, fileName: record.file_name });
  } catch (error) {
    console.error("Get download URL error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to get download URL" },
      { status: 500 },
    );
  }
}
