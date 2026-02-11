import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSignedUrl } from "@/lib/s3";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(url, key);
}

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

    const supabase = getSupabaseClient();

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
