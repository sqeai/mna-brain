import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { CompanyRepository } from '@/lib/repositories';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = createSupabaseClient();
    const companyRepo = new CompanyRepository(db);

    const data = await companyRepo.findDetails(id);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch details';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
