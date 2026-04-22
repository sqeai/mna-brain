import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/server/supabase";
import { FileRepository } from "@/lib/repositories";
import { getSignedUrl } from "@/lib/s3";

/**
 * GET - Generate a pre-signed download URL for a specific file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    const db = createSupabaseClient();
    const fileRepo = new FileRepository(db);

    const record = await fileRepo.findLinkAndNameById(id);
    const downloadUrl = await getSignedUrl(record.file_link, 3600, record.file_name);

    return NextResponse.json({ success: true, download_url: downloadUrl });
  } catch (error) {
    console.error("Generate download URL error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to generate download URL" },
      { status: 500 },
    );
  }
}
