import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { ScreeningRepository } from '@/lib/repositories';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const updates = await req.json();
    const db = createSupabaseClient();
    const screeningRepo = new ScreeningRepository(db);

    const data = await screeningRepo.update(id, updates);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update screening';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
