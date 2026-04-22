import type { DbClient, Tables, TablesInsert, TablesUpdate } from './types';

export class CriteriaRepository {
  constructor(private readonly db: DbClient) {}

  async findAll(): Promise<Tables<'criterias'>[]> {
    const { data, error } = await this.db
      .from('criterias')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async insert(data: Pick<TablesInsert<'criterias'>, 'name' | 'prompt'>): Promise<Tables<'criterias'>> {
    const { data: result, error } = await this.db
      .from('criterias')
      .insert(data)
      .select('*')
      .single();

    if (error) throw error;
    return result;
  }

  async update(
    id: string,
    updates: Pick<TablesUpdate<'criterias'>, 'name' | 'prompt'>,
  ): Promise<Tables<'criterias'>> {
    const { data, error } = await this.db
      .from('criterias')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('criterias').delete().eq('id', id);
    if (error) throw error;
  }
}
