import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserCompanyFavoriteRepository } from '@/lib/repositories';
import { UserService } from './userService';

function makeRepoStub(): UserCompanyFavoriteRepository {
  return {
    listByUser: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    has: vi.fn(),
  } as unknown as UserCompanyFavoriteRepository;
}

describe('UserService.toggleFavorite', () => {
  let repo: UserCompanyFavoriteRepository;
  let service: UserService;

  beforeEach(() => {
    repo = makeRepoStub();
    service = new UserService(repo);
  });

  it('adds the company when it is not yet favorited', async () => {
    vi.mocked(repo.has).mockResolvedValue(false);
    vi.mocked(repo.listByUser).mockResolvedValue(['a', 'b', 'c']);

    const result = await service.toggleFavorite('user-1', 'c');

    expect(repo.add).toHaveBeenCalledWith('user-1', 'c');
    expect(repo.remove).not.toHaveBeenCalled();
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('removes the company when it is already favorited', async () => {
    vi.mocked(repo.has).mockResolvedValue(true);
    vi.mocked(repo.listByUser).mockResolvedValue(['a', 'c']);

    const result = await service.toggleFavorite('user-1', 'b');

    expect(repo.remove).toHaveBeenCalledWith('user-1', 'b');
    expect(repo.add).not.toHaveBeenCalled();
    expect(result).toEqual(['a', 'c']);
  });

  it('returns an empty list when no favorites remain', async () => {
    vi.mocked(repo.has).mockResolvedValue(true);
    vi.mocked(repo.listByUser).mockResolvedValue([]);

    const result = await service.toggleFavorite('user-1', 'only');

    expect(repo.remove).toHaveBeenCalledWith('user-1', 'only');
    expect(result).toEqual([]);
  });
});

describe('UserService.findFavorites', () => {
  it('delegates to the repository', async () => {
    const repo = makeRepoStub();
    vi.mocked(repo.listByUser).mockResolvedValue(['a', 'b']);
    const service = new UserService(repo);

    const result = await service.findFavorites('user-1');

    expect(repo.listByUser).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(['a', 'b']);
  });
});
