import { describe, expect, it, vi } from 'vitest';
import type { DealNoteRepository } from '@/lib/repositories';
import { DealNoteService } from './dealNoteService';

function makeRepoStub(): DealNoteRepository {
  return {
    findByDealId: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  } as unknown as DealNoteRepository;
}

describe('DealNoteService.create', () => {
  it('defaults stage to L0 when not provided', async () => {
    const repo = makeRepoStub();
    const service = new DealNoteService(repo);

    await service.create('company-1', 'Met with the founder.');

    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ stage: 'L0' }),
    );
  });

  it('uses the provided stage when given', async () => {
    const repo = makeRepoStub();
    const service = new DealNoteService(repo);

    await service.create('company-1', 'IOI submitted.', 'L2');

    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ stage: 'L2' }),
    );
  });

  it('passes the deal_id and content through', async () => {
    const repo = makeRepoStub();
    const service = new DealNoteService(repo);

    await service.create('company-1', 'Met with the founder.');

    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ deal_id: 'company-1', content: 'Met with the founder.' }),
    );
  });
});
