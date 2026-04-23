import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { createContainer } from '@/lib/services';

export async function GET() {
  try {
    const db = createSupabaseClient();
    const { investmentThesisService } = createContainer(db);
    const data = await investmentThesisService.findActive();
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch investment thesis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = createSupabaseClient();
    const { investmentThesisService } = createContainer(db);
    const body = await req.json();
    const data = await investmentThesisService.upsert(body);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save investment thesis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
