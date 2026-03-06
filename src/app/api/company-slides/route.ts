import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/server/supabase";

/**
 * GET: Fetch all slides for a company, ordered by sort_order.
 * Query: ?companyId=<uuid>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing required query parameter: companyId" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("company_slides")
      .select("*")
      .eq("company_id", companyId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ slides: data || [] });
  } catch (error) {
    console.error("GET company-slides error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new slide.
 * Body: { companyId, title, html, sort_order }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, title, html, sort_order } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing required field: companyId" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("company_slides")
      .insert({
        company_id: companyId,
        title: title || "Untitled",
        html: html || "",
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ slide: data });
  } catch (error) {
    console.error("POST company-slides error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update an existing slide (title, html, sort_order).
 * Body: { id, title?, html?, sort_order? }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, html, sort_order } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (html !== undefined) updates.html = html;
    if (sort_order !== undefined) updates.sort_order = sort_order;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("company_slides")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ slide: data });
  } catch (error) {
    console.error("PUT company-slides error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove a slide by id.
 * Query: ?id=<uuid>
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required query parameter: id" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("company_slides")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE company-slides error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
