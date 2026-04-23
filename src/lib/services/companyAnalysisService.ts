import type { CompanyAnalysisRepository } from '@/lib/repositories';
import type { Tables } from '@/lib/repositories';
import {
  runCompanyAnalysis,
  COMPANY_ANALYSIS_TIMEOUT_SECONDS,
  type CompanyAnalysisPayload,
} from '@/lib/jobs/handlers/companyAnalysis';
import type { JobDispatcher } from './jobDispatcher';

export class CompanyAnalysisService {
  constructor(
    private readonly companyAnalysisRepo: CompanyAnalysisRepository,
    private readonly jobDispatcher: JobDispatcher,
  ) {}

  findByCompanyId(companyId: string) {
    return this.companyAnalysisRepo.findByCompanyId(companyId);
  }

  async dispatch(
    payload: CompanyAnalysisPayload,
  ): Promise<{ jobId: string } | { existing: Tables<'company_analyses'> }> {
    const existing = await this.companyAnalysisRepo.findCompletedByCompanyId(payload.companyId);
    if (existing) return { existing };

    return this.jobDispatcher.dispatch({
      type: 'company_analysis',
      payload: payload as unknown as Record<string, unknown>,
      timeoutSeconds: COMPANY_ANALYSIS_TIMEOUT_SECONDS,
      work: ({ db: runDb, job }) => runCompanyAnalysis(payload, { db: runDb, job }),
    });
  }

  delete(companyId: string) {
    return this.companyAnalysisRepo.deleteByCompanyId(companyId);
  }
}
