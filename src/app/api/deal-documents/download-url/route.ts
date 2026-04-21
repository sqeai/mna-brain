import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/server/supabase";
import { DealDocumentRepository } from "@/lib/repositories";
import { getSignedUrl } from "@/lib/s3";

/**
 * GET - Get a signed URL for downloading or previewing a deal document from S3
 * Query: id (deal_document id), preview (optional, "true" for inline viewing)
 */
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    const preview = request.nextUrl.searchParams.get("preview") === "true";

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 },
      );
    }

    const db = createSupabaseClient();
    const dealDocRepo = new DealDocumentRepository(db);

    const row = await dealDocRepo.findPathAndNameById(id);

    const url = await getSignedUrl(
      row.file_path,
      3600,
      preview ? undefined : (row.file_name ?? undefined),
    );

    return NextResponse.json({ success: true, url, fileName: row.file_name });
  } catch (error) {
    console.error("Get deal document download URL error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to get download URL" },
      { status: 500 },
    );
  }
}
