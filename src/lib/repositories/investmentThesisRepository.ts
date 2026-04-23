import { desc, eq } from 'drizzle-orm';
import { investmentThesis } from '@/lib/db/schema';
import type { DbClient, Tables, TablesInsert, TablesUpdate } from './types';

export class InvestmentThesisRepository {
  constructor(private readonly db: DbClient) {}

  async findActive(): Promise<Tables<'investment_thesis'> | null> {
    const [row] = await this.db
      .select()
      .from(investmentThesis)
      .where(eq(investmentThesis.is_active, true))
      .orderBy(desc(investmentThesis.created_at))
      .limit(1);
    return row ?? null;
  }

  async findActiveList(
    limit = 3,
  ): Promise<Pick<Tables<'investment_thesis'>, 'title' | 'content'>[]> {
    return this.db
      .select({ title: investmentThesis.title, content: investmentThesis.content })
      .from(investmentThesis)
      .where(eq(investmentThesis.is_active, true))
      .orderBy(desc(investmentThesis.updated_at))
      .limit(limit);
  }

  async insert(data: TablesInsert<'investment_thesis'>): Promise<Tables<'investment_thesis'>> {
    const [row] = await this.db.insert(investmentThesis).values(data).returning();
    return row;
  }

  async update(
    id: string,
    updates: TablesUpdate<'investment_thesis'>,
  ): Promise<Tables<'investment_thesis'>> {
    const [row] = await this.db
      .update(investmentThesis)
      .set(updates)
      .where(eq(investmentThesis.id, id))
      .returning();
    if (!row) throw new Error(`Investment thesis ${id} not found`);
    return row;
  }
}
