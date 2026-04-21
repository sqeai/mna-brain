import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { InvestmentThesisRepository } from '@/lib/repositories';

export async function GET() {
  try {
    const db = createSupabaseClient();
    const thesisRepo = new InvestmentThesisRepository(db);

    const data = await thesisRepo.findActive();
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch investment thesis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = createSupabaseClient();
    const thesisRepo = new InvestmentThesisRepository(db);
    const body = await req.json();
    const { id, title, content, scan_frequency, sources_count, next_scan_at } = body;

    if (id) {
      const data = await thesisRepo.update(id, { title, content, scan_frequency, sources_count });
      return NextResponse.json({ data });
    }

    const data = await thesisRepo.insert({
      title: title || 'Default Thesis',
      content,
      scan_frequency,
      sources_count,
      next_scan_at,
    });
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save investment thesis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
