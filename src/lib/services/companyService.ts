import { deleteFile } from '@/lib/s3';
import type { DealStage } from '@/lib/types';
import type {
  CompanyRepository,
  CompanyFilters,
  CompanyLogRepository,
  DealDocumentRepository,
  DealNoteRepository,
  DealLinkRepository,
  TablesInsert,
  TablesUpdate,
} from '@/lib/repositories';

export class CompanyService {
  constructor(
    private readonly companyRepo: CompanyRepository,
    private readonly companyLogRepo: CompanyLogRepository,
    private readonly dealDocRepo: DealDocumentRepository,
    private readonly dealNoteRepo: DealNoteRepository,
    private readonly dealLinkRepo: DealLinkRepository,
  ) {}

  findById(id: string) {
    return this.companyRepo.findById(id);
  }

  list(filters: Omit<CompanyFilters, 'id'>) {
    return this.companyRepo.findAll(filters);
  }

  count(filters: Pick<CompanyFilters, 'id' | 'stage' | 'stageIn' | 'excludeStage' | 'stageNotNull' | 'createdAfter'>) {
    return this.companyRepo.count(filters);
  }

  findDetails(id: string) {
    return this.companyRepo.findDetails(id);
  }

  async create(company: TablesInsert<'companies'>, logAction?: string) {
    const data = await this.companyRepo.insert(company);
    if (logAction) {
      await this.companyLogRepo.insert({ company_id: data.id, action: logAction });
    }
    return data;
  }

  async update(id: string, updates: TablesUpdate<'companies'>, logAction?: string) {
    const data = await this.companyRepo.update(id, updates);
    if (logAction) {
      await this.companyLogRepo.insert({ company_id: id, action: logAction });
    }
    return data;
  }

  async updateMany(ids: string[], updates: TablesUpdate<'companies'>, logAction?: string) {
    const data = await this.companyRepo.updateMany(ids, updates);
    if (logAction) {
      await this.companyLogRepo.insertMany(
        ids.map((company_id) => ({ company_id, action: logAction })),
      );
    }
    return data;
  }

  async delete(id: string) {
    const filePaths = await this.dealDocRepo.findFilePathsByDealId(id);
    if (filePaths.length > 0) {
      await Promise.all(filePaths.map((key) => deleteFile(key)));
    }
    await this.companyRepo.delete(id);
  }

  async promote(
    id: string,
    currentStage: string | undefined,
    nextStage: string,
    note?: string,
    linkUrl?: string,
    linkTitle?: string,
  ) {
    await this.companyRepo.update(id, { pipeline_stage: nextStage as DealStage });
    await this.companyLogRepo.insert({
      company_id: id,
      action: currentStage
        ? `PROMOTED_FROM_${currentStage}_TO_${nextStage}`
        : `PROMOTED_TO_${nextStage}`,
    });
    if (note?.trim()) {
      await this.dealNoteRepo.insert({
        deal_id: id,
        content: note,
        stage: currentStage || 'L0',
      });
    }
    if (linkUrl?.trim()) {
      await this.dealLinkRepo.insert({
        deal_id: id,
        url: linkUrl,
        title: linkTitle || null,
        stage: currentStage || 'L0',
      });
    }
  }

  runL1Filters(id: string) {
    return this.companyRepo.runL1Filters(id);
  }
}
