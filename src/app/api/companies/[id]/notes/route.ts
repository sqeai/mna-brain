import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { DealNoteRepository } from '@/lib/repositories';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { content, stage } = await req.json();
    const db = createSupabaseClient();
    const dealNoteRepo = new DealNoteRepository(db);

    const data = await dealNoteRepo.insert({
      deal_id: id,
      content,
      stage: stage || 'L0',
    });
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add note';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
