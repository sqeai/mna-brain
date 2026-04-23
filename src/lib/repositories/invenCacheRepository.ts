import { ilike, or, sql } from 'drizzle-orm';
import { invenCache } from '@/lib/db/schema';
import type { DbClient, Tables, TablesInsert } from './types';

type InvenCacheSearchResult = Pick<
  Tables<'inven_cache'>,
  'inven_company_id' | 'domain' | 'inven_company_name' | 'website'
>;

export class InvenCacheRepository {
  constructor(private readonly db: DbClient) {}

  async searchByNameOrDescription(
    term: string,
    limit: number,
  ): Promise<InvenCacheSearchResult[]> {
    const pattern = `%${term}%`;
    return this.db
      .select({
        inven_company_id: invenCache.inven_company_id,
        domain: invenCache.domain,
        inven_company_name: invenCache.inven_company_name,
        website: invenCache.website,
      })
      .from(invenCache)
      .where(or(ilike(invenCache.inven_company_name, pattern), ilike(invenCache.description, pattern)))
      .limit(limit);
  }

  async upsert(entry: TablesInsert<'inven_cache'>): Promise<void> {
    const { inven_company_id: _pk, ...rest } = entry;
    void _pk;
    await this.db
      .insert(invenCache)
      .values(entry)
      .onConflictDoUpdate({
        target: invenCache.inven_company_id,
        // Double-cast via `unknown`: `sql\`now()\`` isn't a plain string so it doesn't
        // match `Partial<$inferSelect>`. Drizzle accepts SQL fragments at runtime.
        set: { ...rest, updated_at: sql`now()` } as unknown as TablesInsert<'inven_cache'>,
      });
  }
}
