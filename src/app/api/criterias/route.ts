import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { createContainer } from '@/lib/services';

export async function GET() {
  try {
    const db = createSupabaseClient();
    const { criteriaService } = createContainer(db);
    const data = await criteriaService.findAll();
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch criterias';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = createSupabaseClient();
    const { criteriaService } = createContainer(db);
    const { name, prompt } = await req.json();
    const data = await criteriaService.create(name, prompt);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create criteria';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
