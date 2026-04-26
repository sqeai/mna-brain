import { describe, expect, it, vi } from 'vitest';
import type { DealLinkRepository } from '@/lib/repositories';
import { DealLinkService } from './dealLinkService';

function makeRepoStub(): DealLinkRepository {
  return {
    findByDealId: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  } as unknown as DealLinkRepository;
}

describe('DealLinkService.create', () => {
  it('passes null for title when not provided', async () => {
    const repo = makeRepoStub();
    const service = new DealLinkService(repo);

    await service.create('company-1', 'https://example.com');

    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ title: null }),
    );
  });

  it('passes null for title when an empty string is given', async () => {
    const repo = makeRepoStub();
    const service = new DealLinkService(repo);

    await service.create('company-1', 'https://example.com', '');

    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ title: null }),
    );
  });

  it('passes the provided title when truthy', async () => {
    const repo = makeRepoStub();
    const service = new DealLinkService(repo);

    await service.create('company-1', 'https://example.com', 'Annual Report');

    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Annual Report' }),
    );
  });

  it('defaults stage to L0 when not provided', async () => {
    const repo = makeRepoStub();
    const service = new DealLinkService(repo);

    await service.create('company-1', 'https://example.com');

    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ stage: 'L0' }),
    );
  });

  it('uses the provided stage when given', async () => {
    const repo = makeRepoStub();
    const service = new DealLinkService(repo);

    await service.create('company-1', 'https://example.com', null, 'L2');

    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ stage: 'L2' }),
    );
  });

  it('passes the deal_id and url through', async () => {
    const repo = makeRepoStub();
    const service = new DealLinkService(repo);

    await service.create('company-1', 'https://example.com');

    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ deal_id: 'company-1', url: 'https://example.com' }),
    );
  });
});
