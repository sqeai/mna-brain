import type { JobRepository } from '@/lib/repositories';
import { DEFAULT_STUCK_BUFFER_SECONDS, buildStuckReason } from '@/lib/jobs/stuck';

export interface StuckJobCleanupResult {
  cleaned: number;
  failed: number;
  jobIds: string[];
}

export class JobService {
  constructor(private readonly jobRepo: JobRepository) {}

  findByIdWithLogs(id: string) {
    return this.jobRepo.findByIdWithLogs(id);
  }

  async cleanupStuckJobs(
    bufferSeconds: number = DEFAULT_STUCK_BUFFER_SECONDS,
  ): Promise<StuckJobCleanupResult> {
    const stuck = await this.jobRepo.findStuck(bufferSeconds);
    const jobIds: string[] = [];
    let failed = 0;
    for (const job of stuck) {
      try {
        await this.jobRepo.markStuckAsTimedOut(job.id, buildStuckReason(job));
        jobIds.push(job.id);
      } catch (err) {
        failed += 1;
        console.error(`[jobs] failed to cleanup stuck job ${job.id}:`, err);
      }
    }
    return { cleaned: jobIds.length, failed, jobIds };
  }
}
