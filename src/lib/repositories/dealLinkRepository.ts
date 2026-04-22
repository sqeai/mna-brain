import type { DbClient, Tables, TablesInsert } from './types';

export class DealLinkRepository {
  constructor(private readonly db: DbClient) {}

  async findByDealId(dealId: string): Promise<Tables<'deal_links'>[]> {
    const { data, error } = await this.db
      .from('deal_links')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async insert(data: TablesInsert<'deal_links'>): Promise<Tables<'deal_links'>> {
    const { data: result, error } = await this.db
      .from('deal_links')
      .insert(data)
      .select('*')
      .single();

    if (error) throw error;
    return result;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('deal_links').delete().eq('id', id);
    if (error) throw error;
  }
}
