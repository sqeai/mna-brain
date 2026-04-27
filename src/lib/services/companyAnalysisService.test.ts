import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CompanyAnalysisRepository } from '@/lib/repositories';
import type { Tables } from '@/lib/repositories';
import type { JobDispatcher } from './jobDispatcher';
import { CompanyAnalysisService } from './companyAnalysisService';

vi.mock('@/lib/jobs/handlers/companyAnalysis', () => ({
  runCompanyAnalysis: vi.fn(),
  COMPANY_ANALYSIS_TIMEOUT_SECONDS: 300,
}));

type Analysis = Tables<'company_analyses'>;

function makeAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  return {
    id: 'analysis-1',
    company_id: 'company-1',
    status: 'completed',
    business_overview: null,
    business_model_summary: null,
    key_takeaways: null,
    investment_highlights: null,
    investment_risks: null,
    diligence_priorities: null,
    sources: null,
    error_message: null,
    job_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as Analysis;
}

function makeRepoStub(): CompanyAnalysisRepository {
  return {
    findByCompanyId: vi.fn(),
    findCompletedByCompanyId: vi.fn(),
    insert: vi.fn(),
    upsertByCompanyId: vi.fn(),
    updateByCompanyId: vi.fn(),
    deleteByCompanyId: vi.fn(),
  } as unknown as CompanyAnalysisRepository;
}

function makeDispatcherStub(): JobDispatcher {
  return {
    dispatch: vi.fn(),
  } as unknown as JobDispatcher;
}

describe('CompanyAnalysisService.dispatch', () => {
  let repo: CompanyAnalysisRepository;
  let dispatcher: JobDispatcher;
  let service: CompanyAnalysisService;

  beforeEach(() => {
    repo = makeRepoStub();
    dispatcher = makeDispatcherStub();
    service = new CompanyAnalysisService(repo, dispatcher);
  });

  it('returns the existing analysis when one is already completed (idempotent)', async () => {
    const existing = makeAnalysis({ status: 'completed' });
    vi.mocked(repo.findCompletedByCompanyId).mockResolvedValue(existing);

    const result = await service.dispatch({ companyId: 'company-1' } as any);

    expect(result).toEqual({ existing });
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('dispatches a new job when no completed analysis exists', async () => {
    vi.mocked(repo.findCompletedByCompanyId).mockResolvedValue(undefined);
    vi.mocked(dispatcher.dispatch).mockResolvedValue({ jobId: 'job-new' });

    const result = await service.dispatch({ companyId: 'company-1' } as any);

    expect(dispatcher.dispatch).toHaveBeenCalledOnce();
    expect(result).toEqual({ jobId: 'job-new' });
  });
});
