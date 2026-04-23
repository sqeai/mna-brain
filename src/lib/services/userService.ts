import type { UserRepository } from '@/lib/repositories';

export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  findFavorites(userId: string) {
    return this.userRepo.findFavoriteCompanies(userId);
  }

  async toggleFavorite(userId: string, companyId: string) {
    const current = await this.userRepo.findFavoriteCompanies(userId);
    const isFavorited = current.includes(companyId);
    const updated = isFavorited
      ? current.filter((c) => c !== companyId)
      : [...current, companyId];
    await this.userRepo.update(userId, { favorite_companies: updated });
    return updated;
  }
}
