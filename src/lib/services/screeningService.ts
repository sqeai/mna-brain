import type { ScreeningRepository, TablesInsert } from '@/lib/repositories';

export class ScreeningService {
  constructor(private readonly screeningRepo: ScreeningRepository) {}

  findAll(opts: { companyId?: string; onlyL0?: boolean }) {
    return this.screeningRepo.findAllWithRelations(opts);
  }

  create(data: TablesInsert<'screenings'>) {
    return this.screeningRepo.insert(data);
  }

  update(id: string, updates: Parameters<ScreeningRepository['update']>[1]) {
    return this.screeningRepo.update(id, updates);
  }

  prepare(companyIds: string[], criteriaIds: string[]) {
    return this.screeningRepo.upsertOrReset(companyIds, criteriaIds);
  }
}
