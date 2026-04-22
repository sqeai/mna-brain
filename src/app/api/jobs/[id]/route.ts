import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { JobRepository } from '@/lib/repositories';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = createSupabaseClient();
    const jobRepo = new JobRepository(db);

    const job = await jobRepo.findByIdWithLogs(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load job';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
