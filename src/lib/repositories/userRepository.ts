import type { DbClient, Tables, TablesUpdate } from './types';

export class UserRepository {
  constructor(private readonly db: DbClient) {}

  async findByEmailAndPassword(
    email: string,
    password: string,
  ): Promise<Tables<'users'> | null> {
    const { data, error } = await this.db
      .from('users')
      .select('*')
      .ilike('email', email.toLowerCase().trim())
      .eq('password', password)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  }

  async findFavoriteCompanies(id: string): Promise<string[]> {
    const { data, error } = await this.db
      .from('users')
      .select('favorite_companies')
      .eq('id', id)
      .single();

    if (error) throw error;
    return (data?.favorite_companies as string[]) ?? [];
  }

  async update(id: string, updates: TablesUpdate<'users'>): Promise<void> {
    const { error } = await this.db.from('users').update(updates).eq('id', id);
    if (error) throw error;
  }
}
