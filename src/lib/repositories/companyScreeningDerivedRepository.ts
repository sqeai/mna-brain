import { eq, inArray } from 'drizzle-orm';
import { companyScreeningDerived } from '@/lib/db/schema';
import type { DbClient, Tables, TablesInsert } from './types';

export class CompanyScreeningDerivedRepository {
  constructor(private readonly db: DbClient) {}

  async findByCompany(
    companyId: string,
  ): Promise<Tables<'company_screening_derived'> | null> {
    const [row] = await this.db
      .select()
      .from(companyScreeningDerived)
      .where(eq(companyScreeningDerived.company_id, companyId))
      .limit(1);
    return row ?? null;
  }

  async findByCompanies(
    companyIds: string[],
  ): Promise<Tables<'company_screening_derived'>[]> {
    if (companyIds.length === 0) return [];
    return this.db
      .select()
      .from(companyScreeningDerived)
      .where(inArray(companyScreeningDerived.company_id, companyIds));
  }

  async upsertByCompany(data: TablesInsert<'company_screening_derived'>): Promise<void> {
    const { company_id, ...rest } = data;
    await this.db
      .insert(companyScreeningDerived)
      .values(data)
      .onConflictDoUpdate({
        target: companyScreeningDerived.company_id,
        set: {
          ...rest,
          updated_at: new Date().toISOString(),
        },
      });
  }

  async deleteByCompany(companyId: string): Promise<void> {
    await this.db
      .delete(companyScreeningDerived)
      .where(eq(companyScreeningDerived.company_id, companyId));
  }
}
