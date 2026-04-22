import type { DbClient, Tables, TablesInsert, TablesUpdate } from './types';

export class CompanySlidesRepository {
  constructor(private readonly db: DbClient) {}

  async findByCompanyId(companyId: string): Promise<Tables<'company_slides'>[]> {
    const { data, error } = await this.db
      .from('company_slides')
      .select('*')
      .eq('company_id', companyId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async insert(data: TablesInsert<'company_slides'>): Promise<Tables<'company_slides'>> {
    const { data: result, error } = await this.db
      .from('company_slides')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async update(id: string, updates: TablesUpdate<'company_slides'>): Promise<Tables<'company_slides'>> {
    const { data, error } = await this.db
      .from('company_slides')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('company_slides').delete().eq('id', id);
    if (error) throw error;
  }
}
