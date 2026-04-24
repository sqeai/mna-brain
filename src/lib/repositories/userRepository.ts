import { eq, ilike } from 'drizzle-orm';
import { users } from '@/lib/db/schema';
import type { DbClient, Tables, TablesInsert, TablesUpdate } from './types';

export class UserRepository {
  constructor(private readonly db: DbClient) {}

  async findByEmail(email: string): Promise<Tables<'users'> | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(ilike(users.email, email.toLowerCase().trim()))
      .limit(1);
    return row ?? null;
  }

  async create(row: TablesInsert<'users'>): Promise<Tables<'users'>> {
    const [created] = await this.db.insert(users).values(row).returning();
    return created;
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
