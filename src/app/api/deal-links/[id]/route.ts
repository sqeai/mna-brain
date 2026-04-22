import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { DealLinkRepository } from '@/lib/repositories';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = createSupabaseClient();
    const dealLinkRepo = new DealLinkRepository(db);

    await dealLinkRepo.delete(id);
    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete link';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
