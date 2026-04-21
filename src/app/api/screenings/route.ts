import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { ScreeningRepository } from '@/lib/repositories';

export async function GET(req: NextRequest) {
  try {
    const db = createSupabaseClient();
    const screeningRepo = new ScreeningRepository(db);
    const params = req.nextUrl.searchParams;

    const companyId = params.get('companyId') ?? undefined;
    const onlyL0 = params.get('onlyL0') === 'true';

    const data = await screeningRepo.findAllWithRelations({ companyId, onlyL0 });
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch screenings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = createSupabaseClient();
    const screeningRepo = new ScreeningRepository(db);
    const body = await req.json();

    const data = await screeningRepo.insert(body);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create screening';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
