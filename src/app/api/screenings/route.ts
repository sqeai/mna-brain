import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { createContainer } from '@/lib/services';

export async function GET(req: NextRequest) {
  try {
    const db = createSupabaseClient();
    const { screeningService } = createContainer(db);
    const params = req.nextUrl.searchParams;
    const companyId = params.get('companyId') ?? undefined;
    const onlyL0 = params.get('onlyL0') === 'true';
    const data = await screeningService.findAll({ companyId, onlyL0 });
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch screenings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = createSupabaseClient();
    const { screeningService } = createContainer(db);
    const body = await req.json();
    const data = await screeningService.create(body);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create screening';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
