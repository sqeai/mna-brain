import { and, eq, sql } from 'drizzle-orm';
import { companyAnalyses } from '@/lib/db/schema';
import type { DbClient, Tables, TablesInsert, TablesUpdate } from './types';

export class CompanyAnalysisRepository {
  constructor(private readonly db: DbClient) {}

  async findByCompanyId(companyId: string): Promise<Tables<'company_analyses'> | null> {
    const [row] = await this.db
      .select()
      .from(companyAnalyses)
      .where(eq(companyAnalyses.company_id, companyId))
      .limit(1);
    return row ?? null;
  }

  async findCompletedByCompanyId(companyId: string): Promise<Tables<'company_analyses'> | null> {
    const [row] = await this.db
      .select()
      .from(companyAnalyses)
      .where(and(eq(companyAnalyses.company_id, companyId), eq(companyAnalyses.status, 'completed')))
      .limit(1);
    return row ?? null;
  }

  async insert(data: TablesInsert<'company_analyses'>): Promise<Tables<'company_analyses'>> {
    const [row] = await this.db.insert(companyAnalyses).values(data).returning();
    return row;
  }

  async upsertByCompanyId(data: TablesInsert<'company_analyses'>): Promise<void> {
    // Drop company_id from the UPDATE set so the conflict-key is never self-updated.
    const { company_id: _ignored, ...rest } = data;
    void _ignored;
    await this.db
      .insert(companyAnalyses)
      .values(data)
      .onConflictDoUpdate({
        target: companyAnalyses.company_id,
        // Double-cast via `unknown`: the `sql\`now()\`` value isn't a plain string so it
        // doesn't match `Partial<$inferSelect>` directly. Drizzle accepts `SQL` fragments
        // at runtime; the cast tells TS to trust us.
        set: { ...rest, updated_at: sql`now()` } as unknown as TablesUpdate<'company_analyses'>,
      });
  }

  async updateByCompanyId(
    companyId: string,
    updates: TablesUpdate<'company_analyses'>,
  ): Promise<Tables<'company_analyses'>> {
    const [row] = await this.db
      .update(companyAnalyses)
      .set(updates)
      .where(eq(companyAnalyses.company_id, companyId))
      .returning();
    if (!row) throw new Error(`Company analysis for ${companyId} not found`);
    return row;
  }

  async deleteByCompanyId(companyId: string): Promise<void> {
    await this.db.delete(companyAnalyses).where(eq(companyAnalyses.company_id, companyId));
  }
}
