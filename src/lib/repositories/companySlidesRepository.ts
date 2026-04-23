import { asc, eq } from 'drizzle-orm';
import { companySlides } from '@/lib/db/schema';
import type { DbClient, Tables, TablesInsert, TablesUpdate } from './types';

export class CompanySlidesRepository {
  constructor(private readonly db: DbClient) {}

  async findByCompanyId(companyId: string): Promise<Tables<'company_slides'>[]> {
    return this.db
      .select()
      .from(companySlides)
      .where(eq(companySlides.company_id, companyId))
      .orderBy(asc(companySlides.sort_order));
  }

  async insert(data: TablesInsert<'company_slides'>): Promise<Tables<'company_slides'>> {
    const [row] = await this.db.insert(companySlides).values(data).returning();
    return row;
  }

  async update(
    id: string,
    updates: TablesUpdate<'company_slides'>,
  ): Promise<Tables<'company_slides'>> {
    const [row] = await this.db
      .update(companySlides)
      .set(updates)
      .where(eq(companySlides.id, id))
      .returning();
    if (!row) throw new Error(`Company slide ${id} not found`);
    return row;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(companySlides).where(eq(companySlides.id, id));
  }
}
