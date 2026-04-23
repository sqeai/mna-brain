import { desc, eq } from 'drizzle-orm';
import { dealLinks } from '@/lib/db/schema';
import type { DbClient, Tables, TablesInsert } from './types';

export class DealLinkRepository {
  constructor(private readonly db: DbClient) {}

  async findByDealId(dealId: string): Promise<Tables<'deal_links'>[]> {
    return this.db
      .select()
      .from(dealLinks)
      .where(eq(dealLinks.deal_id, dealId))
      .orderBy(desc(dealLinks.created_at));
  }

  async insert(data: TablesInsert<'deal_links'>): Promise<Tables<'deal_links'>> {
    const [row] = await this.db.insert(dealLinks).values(data).returning();
    return row;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(dealLinks).where(eq(dealLinks.id, id));
  }
}
