import type { UserCompanyFavoriteRepository } from '@/lib/repositories';

export class UserService {
  constructor(private readonly favoritesRepo: UserCompanyFavoriteRepository) {}

  list() {
    return this.userRepo.findAll();
  }

  findFavorites(userId: string) {
    return this.favoritesRepo.listByUser(userId);
  }

  async toggleFavorite(userId: string, companyId: string) {
    const isFavorited = await this.favoritesRepo.has(userId, companyId);
    if (isFavorited) {
      await this.favoritesRepo.remove(userId, companyId);
    } else {
      await this.favoritesRepo.add(userId, companyId);
    }
    return this.favoritesRepo.listByUser(userId);
  }
}
