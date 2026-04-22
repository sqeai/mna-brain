import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { dispatchJob } from '@/lib/jobs/dispatch';
import {
  SLIDE_GENERATION_TIMEOUT_SECONDS,
  runSlideGeneration,
  type SlideGenerationPayload,
} from '@/lib/jobs/handlers/slideGeneration';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SlideGenerationPayload;

    if (!body.instruction) {
      return NextResponse.json(
        { error: 'Missing required field: instruction' },
        { status: 400 },
      );
    }

    const db = createSupabaseClient();
    const { jobId } = await dispatchJob({
      db,
      createDb: createSupabaseClient,
      type: 'slide_generation',
      payload: body as unknown as Record<string, unknown>,
      timeoutSeconds: SLIDE_GENERATION_TIMEOUT_SECONDS,
      work: async () => runSlideGeneration(body),
    });

    return NextResponse.json({ jobId }, { status: 202 });
  } catch (error) {
    console.error('POST slide-generate error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 },
    );
  }
}
