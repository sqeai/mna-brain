import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { ScreeningRepository } from '@/lib/repositories';

export async function POST(req: NextRequest) {
  try {
    const db = createSupabaseClient();
    const screeningRepo = new ScreeningRepository(db);
    const { companyIds, criteriaIds } = await req.json();

    if (!Array.isArray(companyIds) || !Array.isArray(criteriaIds)) {
      return NextResponse.json(
        { error: 'companyIds and criteriaIds are required arrays' },
        { status: 400 },
      );
    }

    const data = await screeningRepo.upsertOrReset(companyIds, criteriaIds);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to prepare screenings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
