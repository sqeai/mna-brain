import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { CompanyRepository } from '@/lib/repositories';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = createSupabaseClient();
    const companyRepo = new CompanyRepository(db);

    const data = await companyRepo.runL1Filters(id);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to run L1 filters';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
