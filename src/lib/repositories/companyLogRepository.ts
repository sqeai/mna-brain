import { asc, eq } from 'drizzle-orm';
import { companyLogs } from '@/lib/db/schema';
import type { DbClient, Tables, TablesInsert } from './types';

type CompanyLogSummary = Pick<Tables<'company_logs'>, 'id' | 'action' | 'created_at'>;

export class CompanyLogRepository {
  constructor(private readonly db: DbClient) {}

  async findByCompanyId(companyId: string): Promise<CompanyLogSummary[]> {
    return this.db
      .select({
        id: companyLogs.id,
        action: companyLogs.action,
        created_at: companyLogs.created_at,
      })
      .from(companyLogs)
      .where(eq(companyLogs.company_id, companyId))
      .orderBy(asc(companyLogs.created_at));
  }

  async insert(
    entry: Pick<TablesInsert<'company_logs'>, 'company_id' | 'action'>,
  ): Promise<void> {
    await this.db.insert(companyLogs).values(entry);
  }

  async insertMany(
    entries: Array<Pick<TablesInsert<'company_logs'>, 'company_id' | 'action'>>,
  ): Promise<void> {
    if (entries.length === 0) return;
    await this.db.insert(companyLogs).values(entries);
  }
}
