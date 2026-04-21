import type { DbClient, Tables, TablesInsert } from './types';

export class DealNoteRepository {
  constructor(private readonly db: DbClient) {}

  async findByDealId(dealId: string): Promise<Tables<'deal_notes'>[]> {
    const { data, error } = await this.db
      .from('deal_notes')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async insert(data: TablesInsert<'deal_notes'>): Promise<Tables<'deal_notes'>> {
    const { data: result, error } = await this.db
      .from('deal_notes')
      .insert(data)
      .select('*')
      .single();

    if (error) throw error;
    return result;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('deal_notes').delete().eq('id', id);
    if (error) throw error;
  }
}
