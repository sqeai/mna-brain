import type { ScreeningRepository } from '@/lib/repositories';
import {
  runAIScreening,
  AI_SCREENING_TIMEOUT_SECONDS,
  type AIScreeningPayload,
} from '@/lib/jobs/handlers/aiScreening';
import type { JobDispatcher } from './jobDispatcher';

export class AIScreeningService {
  constructor(
    private readonly screeningRepo: ScreeningRepository,
    private readonly jobDispatcher: JobDispatcher,
  ) {}

  dispatch(payload: AIScreeningPayload): Promise<{ jobId: string }> {
    return this.jobDispatcher.dispatch({
      type: 'ai_screening',
      payload: payload as unknown as Record<string, unknown>,
      timeoutSeconds: AI_SCREENING_TIMEOUT_SECONDS,
      work: ({ db: runDb, job }) => runAIScreening(payload, { db: runDb, job }),
    });
  }
}
