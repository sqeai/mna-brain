import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRepository } from '@/lib/repositories';
import { UserService } from './userService';

function makeRepoStub(): UserRepository {
  return {
    findFavoriteCompanies: vi.fn(),
    update: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
  } as unknown as UserRepository;
}

describe('UserService.toggleFavorite', () => {
  let repo: UserRepository;
  let service: UserService;

  beforeEach(() => {
    repo = makeRepoStub();
    service = new UserService(repo);
  });

  it('adds the company when it is not yet favorited', async () => {
    vi.mocked(repo.findFavoriteCompanies).mockResolvedValue(['a', 'b']);

    const result = await service.toggleFavorite('user-1', 'c');

    expect(result).toEqual(['a', 'b', 'c']);
    expect(repo.update).toHaveBeenCalledWith('user-1', { favorite_companies: ['a', 'b', 'c'] });
  });

  it('removes the company when it is already favorited', async () => {
    vi.mocked(repo.findFavoriteCompanies).mockResolvedValue(['a', 'b', 'c']);

    const result = await service.toggleFavorite('user-1', 'b');

    expect(result).toEqual(['a', 'c']);
    expect(repo.update).toHaveBeenCalledWith('user-1', { favorite_companies: ['a', 'c'] });
  });

  it('handles an initially empty favorites list', async () => {
    vi.mocked(repo.findFavoriteCompanies).mockResolvedValue([]);

    const result = await service.toggleFavorite('user-1', 'x');

    expect(result).toEqual(['x']);
  });
});
