import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import {
  CompanyRepository,
  CompanyLogRepository,
  DealNoteRepository,
  DealLinkRepository,
} from '@/lib/repositories';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { currentStage, nextStage, note, linkUrl, linkTitle } = await req.json();
    const db = createSupabaseClient();
    const companyRepo = new CompanyRepository(db);
    const companyLogRepo = new CompanyLogRepository(db);
    const dealNoteRepo = new DealNoteRepository(db);
    const dealLinkRepo = new DealLinkRepository(db);

    await companyRepo.update(id, { pipeline_stage: nextStage });

    await companyLogRepo.insert({
      company_id: id,
      action: currentStage
        ? `PROMOTED_FROM_${currentStage}_TO_${nextStage}`
        : `PROMOTED_TO_${nextStage}`,
    });

    if (note?.trim()) {
      await dealNoteRepo.insert({
        deal_id: id,
        content: note,
        stage: currentStage || 'L0',
      });
    }

    if (linkUrl?.trim()) {
      await dealLinkRepo.insert({
        deal_id: id,
        url: linkUrl,
        title: linkTitle || null,
        stage: currentStage || 'L0',
      });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to promote company';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
