import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserCompanyFavoriteRepository, UserRepository } from '@/lib/repositories';
import { UserService } from './userService';

function makeUserRepoStub(): UserRepository {
  return {
    findAll: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  } as unknown as UserRepository;
}

function makeFavoritesRepoStub(): UserCompanyFavoriteRepository {
  return {
    listByUser: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    has: vi.fn(),
  } as unknown as UserCompanyFavoriteRepository;
}

describe('UserService', () => {
  let userRepo: UserRepository;
  let favoritesRepo: UserCompanyFavoriteRepository;
  let service: UserService;

  beforeEach(() => {
    userRepo = makeUserRepoStub();
    favoritesRepo = makeFavoritesRepoStub();
    service = new UserService(userRepo, favoritesRepo);
  });

  describe('list', () => {
    it('returns all users from the user repository', async () => {
      const users = [
        { id: '1', name: 'Alice', email: 'a@x.com', role: 'admin' },
        { id: '2', name: 'Bob', email: 'b@x.com', role: 'user' },
      ];
      vi.mocked(userRepo.findAll).mockResolvedValue(users as never);

      const result = await service.list();

      expect(result).toEqual(users);
      expect(userRepo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findFavorites', () => {
    it("returns the user's favorite company ids", async () => {
      vi.mocked(favoritesRepo.listByUser).mockResolvedValue(['a', 'b']);

      const result = await service.findFavorites('user-1');

      expect(result).toEqual(['a', 'b']);
      expect(favoritesRepo.listByUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('toggleFavorite', () => {
    it('adds the company when it is not yet favorited', async () => {
      vi.mocked(favoritesRepo.has).mockResolvedValue(false);
      vi.mocked(favoritesRepo.listByUser).mockResolvedValue(['a', 'b', 'c']);

      const result = await service.toggleFavorite('user-1', 'c');

      expect(favoritesRepo.add).toHaveBeenCalledWith('user-1', 'c');
      expect(favoritesRepo.remove).not.toHaveBeenCalled();
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('removes the company when it is already favorited', async () => {
      vi.mocked(favoritesRepo.has).mockResolvedValue(true);
      vi.mocked(favoritesRepo.listByUser).mockResolvedValue(['a', 'c']);

      const result = await service.toggleFavorite('user-1', 'b');

      expect(favoritesRepo.remove).toHaveBeenCalledWith('user-1', 'b');
      expect(favoritesRepo.add).not.toHaveBeenCalled();
      expect(result).toEqual(['a', 'c']);
    });
  });
});
