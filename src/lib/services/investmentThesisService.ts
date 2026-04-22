import type { InvestmentThesisRepository } from '@/lib/repositories';

interface ThesisBody {
  id?: string;
  title?: string;
  content?: string;
  scan_frequency?: string;
  sources_count?: number;
  next_scan_at?: string;
}

export class InvestmentThesisService {
  constructor(private readonly thesisRepo: InvestmentThesisRepository) {}

  findActive() {
    return this.thesisRepo.findActive();
  }

  upsert(body: ThesisBody) {
    const { id, title, content, scan_frequency, sources_count, next_scan_at } = body;
    if (id) {
      return this.thesisRepo.update(id, { title, content, scan_frequency, sources_count });
    }
    return this.thesisRepo.insert({
      title: title || 'Default Thesis',
      content: content ?? '',
      scan_frequency,
      sources_count,
      next_scan_at,
    });
  }
}
