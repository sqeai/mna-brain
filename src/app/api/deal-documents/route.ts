import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/server/supabase";
import { deleteFile } from "@/lib/s3";

/**
 * POST - Register a deal document after client has uploaded to S3
 * Body: { dealId, key, fileName, fileSize?, mimeType?, stage? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealId, key, fileName, fileSize, mimeType, stage } = body;

    if (!dealId || !key || !fileName) {
      return NextResponse.json(
        { error: "dealId, key, and fileName are required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    const { error } = await supabase.from("deal_documents").insert({
      deal_id: dealId,
      file_path: key,
      file_name: fileName,
      file_size: fileSize ?? null,
      mime_type: mimeType ?? null,
      stage: stage ?? "L0",
    });

    if (error) {
      console.error("Deal document insert error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to register document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Register deal document error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to register document" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a deal document (S3 object + DB row)
 * Query: id (deal_document id)
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    const { data: row, error: fetchError } = await supabase
      .from("deal_documents")
      .select("file_path")
      .eq("id", id)
      .single();

    if (fetchError || !row) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    await deleteFile(row.file_path);

    const { error: deleteError } = await supabase
      .from("deal_documents")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Deal document delete error:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete document record" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete deal document error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to delete document" },
      { status: 500 }
    );
  }
}
