import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { createContainer } from '@/lib/services';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { url, title, stage } = await req.json();
    const db = createSupabaseClient();
    const { dealLinkService } = createContainer(db);
    const data = await dealLinkService.create(id, url, title, stage);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add link';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
