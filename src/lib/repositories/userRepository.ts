import { and, eq, ilike } from 'drizzle-orm';
import { users } from '@/lib/db/schema';
import type { DbClient, Tables, TablesUpdate } from './types';

export class UserRepository {
  constructor(private readonly db: DbClient) {}

  async findByEmailAndPassword(
    email: string,
    password: string,
  ): Promise<Tables<'users'> | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(and(ilike(users.email, email.toLowerCase().trim()), eq(users.password, password)))
      .limit(1);
    return row ?? null;
  }

  async findFavoriteCompanies(id: string): Promise<string[]> {
    const [row] = await this.db
      .select({ favorite_companies: users.favorite_companies })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!row) throw new Error(`User ${id} not found`);
    return (row.favorite_companies as string[] | null) ?? [];
  }

  async update(id: string, updates: TablesUpdate<'users'>): Promise<void> {
    await this.db.update(users).set(updates).where(eq(users.id, id));
  }
}
