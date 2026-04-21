import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { CriteriaRepository } from '@/lib/repositories';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, prompt } = await req.json();
    const db = createSupabaseClient();
    const criteriaRepo = new CriteriaRepository(db);

    const data = await criteriaRepo.update(id, { name, prompt });
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update criteria';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = createSupabaseClient();
    const criteriaRepo = new CriteriaRepository(db);

    await criteriaRepo.delete(id);
    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete criteria';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
