import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { DealLinkRepository } from '@/lib/repositories';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { url, title, stage } = await req.json();
    const db = createSupabaseClient();
    const dealLinkRepo = new DealLinkRepository(db);

    const data = await dealLinkRepo.insert({
      deal_id: id,
      url,
      title: title || null,
      stage: stage || 'L0',
    });
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add link';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
