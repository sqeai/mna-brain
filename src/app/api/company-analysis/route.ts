/**
 * API Route for AI Company Card Analysis.
 * POST dispatches an async job that generates analysis; GET returns the latest
 * persisted analysis; DELETE removes it so the next POST regenerates.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { CompanyAnalysisRepository } from '@/lib/repositories';
import { dispatchJob } from '@/lib/jobs/dispatch';
import {
  COMPANY_ANALYSIS_TIMEOUT_SECONDS,
  runCompanyAnalysis,
  type CompanyAnalysisPayload,
} from '@/lib/jobs/handlers/companyAnalysis';

export async function GET(request: NextRequest) {
  try {
    const companyId = new URL(request.url).searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: companyId' },
        { status: 400 },
      );
    }

    const db = createSupabaseClient();
    const analysisRepo = new CompanyAnalysisRepository(db);

    const data = await analysisRepo.findByCompanyId(companyId);

    if (!data) {
      return NextResponse.json(
        { error: 'No analysis found for this company' },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET company-analysis error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CompanyAnalysisPayload;

    if (!body.companyId) {
      return NextResponse.json(
        { error: 'Missing required field: companyId' },
        { status: 400 },
      );
    }

    const db = createSupabaseClient();
    const analysisRepo = new CompanyAnalysisRepository(db);

    const existing = await analysisRepo.findCompletedByCompanyId(body.companyId);
    if (existing) {
      return NextResponse.json(existing);
    }

    const { jobId } = await dispatchJob({
      db,
      createDb: createSupabaseClient,
      type: 'company_analysis',
      payload: body as unknown as Record<string, unknown>,
      timeoutSeconds: COMPANY_ANALYSIS_TIMEOUT_SECONDS,
      work: ({ db: runDb, job }) => runCompanyAnalysis(body, { db: runDb, job }),
    });

    return NextResponse.json({ jobId }, { status: 202 });
  } catch (error) {
    console.error('POST company-analysis error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const companyId = new URL(request.url).searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: companyId' },
        { status: 400 },
      );
    }

    const db = createSupabaseClient();
    const analysisRepo = new CompanyAnalysisRepository(db);

    await analysisRepo.deleteByCompanyId(companyId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE company-analysis error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 },
    );
  }
}
