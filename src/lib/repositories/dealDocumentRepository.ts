import type { DbClient, Tables, TablesInsert } from './types';

export class DealDocumentRepository {
  constructor(private readonly db: DbClient) {}

  async findById(id: string): Promise<Tables<'deal_documents'>> {
    const { data, error } = await this.db
      .from('deal_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findPathAndNameById(
    id: string,
  ): Promise<Pick<Tables<'deal_documents'>, 'file_path' | 'file_name'>> {
    const { data, error } = await this.db
      .from('deal_documents')
      .select('file_path, file_name')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findFilePathsByDealId(dealId: string): Promise<string[]> {
    const { data, error } = await this.db
      .from('deal_documents')
      .select('file_path')
      .eq('deal_id', dealId);

    if (error) throw error;
    return (data ?? []).map((d) => d.file_path).filter(Boolean);
  }

  async insert(data: TablesInsert<'deal_documents'>): Promise<void> {
    const { error } = await this.db.from('deal_documents').insert(data);
    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('deal_documents').delete().eq('id', id);
    if (error) throw error;
  }
}
