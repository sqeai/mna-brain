import { dispatchJob } from '@/lib/jobs/dispatch';
import type { DbClient, Tables } from '@/lib/repositories';
import type { JobType } from '@/lib/jobs/dispatch';

export class JobDispatcher {
  constructor(
    private readonly db: DbClient,
    private readonly createDb: () => DbClient,
  ) {}

  dispatch<T>(opts: {
    type: JobType;
    payload: Record<string, unknown>;
    timeoutSeconds: number;
    work: (ctx: { job: Tables<'jobs'>; db: DbClient }) => Promise<T>;
  }): Promise<{ jobId: string }> {
    return dispatchJob({ db: this.db, createDb: this.createDb, ...opts });
  }
}
