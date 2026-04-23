import type { DealLinkRepository } from '@/lib/repositories';

export class DealLinkService {
  constructor(private readonly dealLinkRepo: DealLinkRepository) {}

  create(dealId: string, url: string, title?: string | null, stage?: string) {
    return this.dealLinkRepo.insert({
      deal_id: dealId,
      url,
      title: title || null,
      stage: stage || 'L0',
    });
  }

  delete(id: string) {
    return this.dealLinkRepo.delete(id);
  }
}
