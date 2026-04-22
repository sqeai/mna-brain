import { NextRequest, NextResponse } from 'next/server';
import { getAgentGraph } from '@/lib/agent';
import { createSupabaseClient } from '@/lib/server/supabase';
import { dispatchJob } from '@/lib/jobs/dispatch';
import {
  MARKET_SCREENING_TIMEOUT_SECONDS,
  runMarketScreening,
  type MarketScreeningPayload,
} from '@/lib/jobs/handlers/marketScreening';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MarketScreeningPayload;

    if (!body.thesis) {
      return NextResponse.json({ error: 'Investment thesis is required' }, { status: 400 });
    }

    const db = createSupabaseClient();
    const { jobId } = await dispatchJob({
      db,
      createDb: createSupabaseClient,
      type: 'market_screening',
      payload: body as unknown as Record<string, unknown>,
      timeoutSeconds: MARKET_SCREENING_TIMEOUT_SECONDS,
      work: ({ db: runDb }) => runMarketScreening(body, { db: runDb }),
    });

    return NextResponse.json({ jobId }, { status: 202 });
  } catch (error: unknown) {
    console.error('Market screening error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const agent = await getAgentGraph();
  return NextResponse.json({
    status: agent ? 'ok' : 'not_configured',
    message: agent ? 'Agent is ready' : 'Agent not available. Check ANTHROPIC_API_KEY.',
  });
}
