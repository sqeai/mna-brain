import type { DbClient, Tables, TablesInsert, TablesUpdate } from './types';

export class CompanyAnalysisRepository {
  constructor(private readonly db: DbClient) {}

  async findByCompanyId(companyId: string): Promise<Tables<'company_analyses'> | null> {
    const { data, error } = await this.db
      .from('company_analyses')
      .select('*')
      .eq('company_id', companyId)
      .single();

    // PGRST116 = row not found — return null instead of throwing
    if (error && error.code !== 'PGRST116') throw error;
    return data ?? null;
  }

  async findCompletedByCompanyId(companyId: string): Promise<Tables<'company_analyses'> | null> {
    const { data, error } = await this.db
      .from('company_analyses')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'completed')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ?? null;
  }

  async insert(data: TablesInsert<'company_analyses'>): Promise<Tables<'company_analyses'>> {
    const { data: result, error } = await this.db
      .from('company_analyses')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async upsertByCompanyId(
    data: TablesInsert<'company_analyses'>,
  ): Promise<void> {
    const { error } = await this.db
      .from('company_analyses')
      .upsert(data, { onConflict: 'company_id' });

    if (error) throw error;
  }

  async updateByCompanyId(
    companyId: string,
    updates: TablesUpdate<'company_analyses'>,
  ): Promise<Tables<'company_analyses'>> {
    const { data, error } = await this.db
      .from('company_analyses')
      .update(updates)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteByCompanyId(companyId: string): Promise<void> {
    const { error } = await this.db
      .from('company_analyses')
      .delete()
      .eq('company_id', companyId);

    if (error) throw error;
  }
}
