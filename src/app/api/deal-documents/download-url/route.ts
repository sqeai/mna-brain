import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/server/supabase";
import { getSignedUrl } from "@/lib/s3";

/**
 * GET - Get a signed URL for downloading or previewing a deal document from S3
 * Query: id (deal_document id), preview (optional, "true" for inline viewing)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const preview = searchParams.get("preview") === "true";

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    const { data: row, error: fetchError } = await supabase
      .from("deal_documents")
      .select("file_path, file_name")
      .eq("id", id)
      .single();

    if (fetchError || !row) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const url = await getSignedUrl(
      row.file_path,
      3600,
      preview ? undefined : (row.file_name ?? undefined)
    );

    return NextResponse.json({
      success: true,
      url,
      fileName: row.file_name,
    });
  } catch (error) {
    console.error("Get deal document download URL error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to get download URL" },
      { status: 500 }
    );
  }
}
