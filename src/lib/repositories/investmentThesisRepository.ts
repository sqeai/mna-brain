import type { DbClient, Tables, TablesInsert, TablesUpdate } from './types';

export class InvestmentThesisRepository {
  constructor(private readonly db: DbClient) {}

  async findActive(): Promise<Tables<'investment_thesis'> | null> {
    const { data, error } = await this.db
      .from('investment_thesis')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  }

  async findActiveList(
    limit = 3,
  ): Promise<Pick<Tables<'investment_thesis'>, 'title' | 'content'>[]> {
    const { data, error } = await this.db
      .from('investment_thesis')
      .select('title, content')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }

  async insert(data: TablesInsert<'investment_thesis'>): Promise<Tables<'investment_thesis'>> {
    const { data: result, error } = await this.db
      .from('investment_thesis')
      .insert(data)
      .select('*')
      .single();

    if (error) throw error;
    return result;
  }

  async update(
    id: string,
    updates: TablesUpdate<'investment_thesis'>,
  ): Promise<Tables<'investment_thesis'>> {
    const { data, error } = await this.db
      .from('investment_thesis')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }
}
