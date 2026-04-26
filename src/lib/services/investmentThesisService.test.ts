import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvestmentThesisRepository } from '@/lib/repositories';
import { InvestmentThesisService } from './investmentThesisService';

function makeRepoStub(): InvestmentThesisRepository {
  return {
    findActive: vi.fn(),
    findActiveList: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  } as unknown as InvestmentThesisRepository;
}

describe('InvestmentThesisService.upsert', () => {
  let repo: InvestmentThesisRepository;
  let service: InvestmentThesisService;

  beforeEach(() => {
    repo = makeRepoStub();
    service = new InvestmentThesisService(repo);
  });

  it('calls update when an id is provided', async () => {
    await service.upsert({ id: 'thesis-1', title: 'Growth', content: 'SaaS focus' });

    expect(repo.update).toHaveBeenCalledWith('thesis-1', expect.objectContaining({ title: 'Growth', content: 'SaaS focus' }));
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('calls insert when no id is provided', async () => {
    await service.upsert({ title: 'Growth', content: 'SaaS focus' });

    expect(repo.insert).toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('defaults title to "Default Thesis" when not provided on insert', async () => {
    await service.upsert({ content: 'Some content' });

    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Default Thesis' }),
    );
  });

  it('defaults content to empty string when not provided on insert (nullish coalescing)', async () => {
    await service.upsert({ title: 'Growth' });

    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ content: '' }),
    );
  });

  it('preserves explicit empty string content on insert', async () => {
    await service.upsert({ title: 'Growth', content: '' });

    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ content: '' }),
    );
  });
});
