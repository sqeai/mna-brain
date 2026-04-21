import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/server/supabase";
import { DealDocumentRepository } from "@/lib/repositories";
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
        { status: 400 },
      );
    }

    const db = createSupabaseClient();
    const dealDocRepo = new DealDocumentRepository(db);

    await dealDocRepo.insert({
      deal_id: dealId,
      file_path: key,
      file_name: fileName,
      file_size: fileSize ?? null,
      mime_type: mimeType ?? null,
      stage: stage ?? "L0",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Register deal document error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to register document" },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Delete a deal document (S3 object + DB row)
 * Query: id (deal_document id)
 */
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 },
      );
    }

    const db = createSupabaseClient();
    const dealDocRepo = new DealDocumentRepository(db);

    const row = await dealDocRepo.findById(id);

    await deleteFile(row.file_path);
    await dealDocRepo.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete deal document error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to delete document" },
      { status: 500 },
    );
  }
}
