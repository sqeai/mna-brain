import type { DealNoteRepository } from '@/lib/repositories';

export class DealNoteService {
  constructor(private readonly dealNoteRepo: DealNoteRepository) {}

  create(dealId: string, content: string, stage?: string) {
    return this.dealNoteRepo.insert({
      deal_id: dealId,
      content,
      stage: stage || 'L0',
    });
  }

  delete(id: string) {
    return this.dealNoteRepo.delete(id);
  }
}
