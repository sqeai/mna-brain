import type { DbClient, Tables, TablesInsert } from './types';

type CompanyLogSummary = Pick<Tables<'company_logs'>, 'id' | 'action' | 'created_at'>;

export class CompanyLogRepository {
  constructor(private readonly db: DbClient) {}

  async findByCompanyId(companyId: string): Promise<CompanyLogSummary[]> {
    const { data, error } = await this.db
      .from('company_logs')
      .select('id, action, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as CompanyLogSummary[];
  }

  async insert(entry: Pick<TablesInsert<'company_logs'>, 'company_id' | 'action'>): Promise<void> {
    const { error } = await this.db.from('company_logs').insert(entry);
    if (error) throw error;
  }

  async insertMany(
    entries: Array<Pick<TablesInsert<'company_logs'>, 'company_id' | 'action'>>,
  ): Promise<void> {
    if (entries.length === 0) return;
    const { error } = await this.db.from('company_logs').insert(entries);
    if (error) throw error;
  }
}
