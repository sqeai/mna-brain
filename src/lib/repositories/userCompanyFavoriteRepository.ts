import { and, eq } from 'drizzle-orm';
import { userCompanyFavorites } from '@/lib/db/schema';
import type { DbClient } from './types';

export class UserCompanyFavoriteRepository {
  constructor(private readonly db: DbClient) {}

  async listByUser(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ company_id: userCompanyFavorites.company_id })
      .from(userCompanyFavorites)
      .where(eq(userCompanyFavorites.user_id, userId));
    return rows.map((r) => r.company_id);
  }

  async add(userId: string, companyId: string): Promise<void> {
    await this.db
      .insert(userCompanyFavorites)
      .values({ user_id: userId, company_id: companyId })
      .onConflictDoNothing();
  }

  async remove(userId: string, companyId: string): Promise<void> {
    await this.db
      .delete(userCompanyFavorites)
      .where(
        and(
          eq(userCompanyFavorites.user_id, userId),
          eq(userCompanyFavorites.company_id, companyId),
        ),
      );
  }

  async has(userId: string, companyId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ user_id: userCompanyFavorites.user_id })
      .from(userCompanyFavorites)
      .where(
        and(
          eq(userCompanyFavorites.user_id, userId),
          eq(userCompanyFavorites.company_id, companyId),
        ),
      )
      .limit(1);
    return !!row;
  }
}
