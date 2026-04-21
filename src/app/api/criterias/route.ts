import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { CriteriaRepository } from '@/lib/repositories';

export async function GET() {
  try {
    const db = createSupabaseClient();
    const criteriaRepo = new CriteriaRepository(db);

    const data = await criteriaRepo.findAll();
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch criterias';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, prompt } = await req.json();
    const db = createSupabaseClient();
    const criteriaRepo = new CriteriaRepository(db);

    const data = await criteriaRepo.insert({ name, prompt });
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create criteria';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
