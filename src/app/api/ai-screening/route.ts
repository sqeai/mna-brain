import { NextRequest, NextResponse } from 'next/server';
import { getAgentGraph } from '@/lib/agent';
import { createSupabaseClient } from '@/lib/server/supabase';
import { dispatchJob } from '@/lib/jobs/dispatch';
import {
  AI_SCREENING_TIMEOUT_SECONDS,
  runAIScreening,
  type AIScreeningPayload,
} from '@/lib/jobs/handlers/aiScreening';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AIScreeningPayload;
    const { companyId, criteriaId, criteriaPrompt, company, screeningId } = body;

    if (!companyId || !criteriaId || !criteriaPrompt || !company || !screeningId) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: companyId, criteriaId, criteriaPrompt, company, screeningId',
        },
        { status: 400 },
      );
    }

    const db = createSupabaseClient();
    const { jobId } = await dispatchJob({
      db,
      createDb: createSupabaseClient,
      type: 'ai_screening',
      payload: body as unknown as Record<string, unknown>,
      timeoutSeconds: AI_SCREENING_TIMEOUT_SECONDS,
      work: ({ db: runDb, job }) => runAIScreening(body, { db: runDb, job }),
    });

    return NextResponse.json({ jobId }, { status: 202 });
  } catch (error) {
    console.error('AI Screening error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET() {
  const agent = await getAgentGraph();
  return NextResponse.json({
    status: agent ? 'ready' : 'not_configured',
    message: agent
      ? 'AI Screening endpoint is ready'
      : 'Agent not available. Check ANTHROPIC_API_KEY.',
  });
}
