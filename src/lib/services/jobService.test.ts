import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobRepository } from '@/lib/repositories';
import type { Tables } from '@/lib/repositories';
import { JobService } from './jobService';

type Job = Tables<'jobs'>;

function makeJob(overrides: Partial<Job>): Job {
  return {
    id: 'job-1',
    type: 'ai_screening',
    status: 'pending',
    payload: {},
    result: null,
    error: null,
    timeout_seconds: 240,
    created_at: new Date().toISOString(),
    started_at: null,
    completed_at: null,
    updated_at: new Date().toISOString(),
    ...overrides,
  } as Job;
}

function makeRepoStub(): JobRepository {
  return {
    findStuck: vi.fn(),
    markStuckAsTimedOut: vi.fn(),
    findByIdWithLogs: vi.fn(),
  } as unknown as JobRepository;
}

describe('JobService.cleanupStuckJobs', () => {
  let repo: JobRepository;
  let service: JobService;

  beforeEach(() => {
    repo = makeRepoStub();
    service = new JobService(repo);
  });

  it('returns zero when nothing is stuck', async () => {
    vi.mocked(repo.findStuck).mockResolvedValue([]);

    const result = await service.cleanupStuckJobs();

    expect(result).toEqual({ cleaned: 0, failed: 0, jobIds: [] });
    expect(repo.markStuckAsTimedOut).not.toHaveBeenCalled();
  });

  it('marks stuck pending and running jobs as timed out', async () => {
    const stuck = [
      makeJob({ id: 'pending-1', status: 'pending', timeout_seconds: 240 }),
      makeJob({ id: 'running-1', status: 'running', timeout_seconds: 120 }),
    ];
    vi.mocked(repo.findStuck).mockResolvedValue(stuck);
    vi.mocked(repo.markStuckAsTimedOut).mockImplementation(async (id) =>
      makeJob({ id, status: 'timed_out' }),
    );

    const result = await service.cleanupStuckJobs();

    expect(result.cleaned).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.jobIds).toEqual(['pending-1', 'running-1']);

    expect(repo.markStuckAsTimedOut).toHaveBeenCalledTimes(2);
    const [pendingCall, runningCall] = vi.mocked(repo.markStuckAsTimedOut).mock.calls;
    expect(pendingCall[0]).toBe('pending-1');
    expect(pendingCall[1]).toMatch(/pending/);
    expect(runningCall[0]).toBe('running-1');
    expect(runningCall[1]).toMatch(/running/);
  });

  it('continues when one cleanup write fails and reports the failure count', async () => {
    const stuck = [
      makeJob({ id: 'a', status: 'pending' }),
      makeJob({ id: 'b', status: 'pending' }),
      makeJob({ id: 'c', status: 'pending' }),
    ];
    vi.mocked(repo.findStuck).mockResolvedValue(stuck);
    vi.mocked(repo.markStuckAsTimedOut).mockImplementation(async (id) => {
      if (id === 'b') throw new Error('write failure');
      return makeJob({ id, status: 'timed_out' });
    });

    // Silence the expected console.error for the failing job.
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await service.cleanupStuckJobs();

    expect(result.cleaned).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.jobIds).toEqual(['a', 'c']);
    expect(repo.markStuckAsTimedOut).toHaveBeenCalledTimes(3);

    errSpy.mockRestore();
  });

  it('forwards the configured buffer to the repository', async () => {
    vi.mocked(repo.findStuck).mockResolvedValue([]);
    await service.cleanupStuckJobs(15);
    expect(repo.findStuck).toHaveBeenCalledWith(15);
  });
});
