import { describe, expect, it } from 'vitest';
import type { Tables } from '@/lib/repositories';
import { buildStuckReason, isStuckJob } from './stuck';

type Job = Tables<'jobs'>;

function makeJob(overrides: Partial<Job>): Job {
  return {
    id: overrides.id ?? 'job-1',
    type: overrides.type ?? 'ai_screening',
    status: overrides.status ?? 'pending',
    payload: overrides.payload ?? {},
    result: overrides.result ?? null,
    error: overrides.error ?? null,
    timeout_seconds: overrides.timeout_seconds ?? 240,
    created_at: overrides.created_at ?? new Date().toISOString(),
    started_at: overrides.started_at ?? null,
    completed_at: overrides.completed_at ?? null,
    updated_at: overrides.updated_at ?? new Date().toISOString(),
  } as Job;
}

describe('isStuckJob', () => {
  const NOW = new Date('2026-04-24T12:00:00Z').getTime();
  const BUFFER = 60;

  it('flags a pending job past timeout + buffer', () => {
    const createdAt = new Date(NOW - (240 + BUFFER + 1) * 1000).toISOString();
    const job = makeJob({ status: 'pending', created_at: createdAt });
    expect(isStuckJob(job, NOW, BUFFER)).toBe(true);
  });

  it('does not flag a pending job within the buffer window', () => {
    const createdAt = new Date(NOW - (240 + BUFFER - 1) * 1000).toISOString();
    const job = makeJob({ status: 'pending', created_at: createdAt });
    expect(isStuckJob(job, NOW, BUFFER)).toBe(false);
  });

  it('flags a running job whose started_at is past timeout + buffer', () => {
    const startedAt = new Date(NOW - (240 + BUFFER + 1) * 1000).toISOString();
    const job = makeJob({ status: 'running', started_at: startedAt });
    expect(isStuckJob(job, NOW, BUFFER)).toBe(true);
  });

  it('does not flag a running job within timeout + buffer', () => {
    const startedAt = new Date(NOW - 30 * 1000).toISOString();
    const job = makeJob({ status: 'running', started_at: startedAt });
    expect(isStuckJob(job, NOW, BUFFER)).toBe(false);
  });

  it('ignores a running job with no started_at', () => {
    const job = makeJob({ status: 'running', started_at: null });
    expect(isStuckJob(job, NOW, BUFFER)).toBe(false);
  });

  it('ignores terminal statuses', () => {
    for (const status of ['completed', 'failed', 'timed_out'] as const) {
      const job = makeJob({
        status,
        created_at: new Date(NOW - 86400 * 1000).toISOString(),
      });
      expect(isStuckJob(job, NOW, BUFFER)).toBe(false);
    }
  });

  it('honors per-job timeout_seconds', () => {
    // Long-timeout job that's still within its own window shouldn't be flagged.
    const createdAt = new Date(NOW - 300 * 1000).toISOString();
    const job = makeJob({
      status: 'pending',
      created_at: createdAt,
      timeout_seconds: 600,
    });
    expect(isStuckJob(job, NOW, BUFFER)).toBe(false);
  });
});

describe('buildStuckReason', () => {
  it('describes pending jobs as never picked up', () => {
    const job = makeJob({ status: 'pending', timeout_seconds: 240 });
    expect(buildStuckReason(job)).toMatch(/pending/);
    expect(buildStuckReason(job)).toMatch(/240/);
  });

  it('describes running jobs as crashed', () => {
    const job = makeJob({ status: 'running', timeout_seconds: 240 });
    expect(buildStuckReason(job)).toMatch(/running/);
    expect(buildStuckReason(job)).toMatch(/crashed/);
  });
});
