import type { DbClient, Tables, TablesInsert, TablesUpdate } from './types';

export class FileRepository {
  constructor(private readonly db: DbClient) {}

  async findById(id: string): Promise<Tables<'files'>> {
    const { data, error } = await this.db
      .from('files')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findLinkAndNameById(
    id: string,
  ): Promise<Pick<Tables<'files'>, 'file_link' | 'file_name'>> {
    const { data, error } = await this.db
      .from('files')
      .select('file_link, file_name')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findAll(fileType?: string): Promise<Tables<'files'>[]> {
    let query = this.db.from('files').select('*');

    if (fileType) query = query.eq('file_type', fileType);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async insert(data: TablesInsert<'files'>): Promise<Tables<'files'>> {
    const { data: result, error } = await this.db
      .from('files')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async update(id: string, updates: TablesUpdate<'files'>): Promise<Tables<'files'>> {
    const { data, error } = await this.db
      .from('files')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePartial(id: string, updates: TablesUpdate<'files'>): Promise<void> {
    const { error } = await this.db.from('files').update(updates).eq('id', id);
    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('files').delete().eq('id', id);
    if (error) throw error;
  }
}
