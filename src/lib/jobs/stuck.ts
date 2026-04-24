import type { Tables } from '@/lib/repositories';

export const DEFAULT_STUCK_BUFFER_SECONDS = 60;

type Job = Tables<'jobs'>;

/**
 * A job is considered "stuck" when it is still pending or running past its own
 * timeout_seconds plus a buffer. Two failure modes this catches:
 *   - pending forever: the request was aborted before `after()` could invoke
 *     the runner, so the row never transitions to running.
 *   - running forever: the runner process died after markRunning but before
 *     the timeout fired, so the row never transitions to a terminal state.
 * The buffer avoids racing with the in-process timeout logic in runJob.
 */
export function isStuckJob(job: Job, now: number, bufferSeconds: number): boolean {
  if (job.status !== 'pending' && job.status !== 'running') return false;

  const thresholdMs = (job.timeout_seconds + bufferSeconds) * 1000;
  const reference = job.status === 'running' ? job.started_at : job.created_at;
  if (!reference) return false;

  return new Date(reference).getTime() + thresholdMs < now;
}

export function buildStuckReason(job: Job): string {
  if (job.status === 'pending') {
    return `Stuck in pending for longer than ${job.timeout_seconds}s; runner never picked it up`;
  }
  return `Stuck in running for longer than ${job.timeout_seconds}s; runner likely crashed`;
}
