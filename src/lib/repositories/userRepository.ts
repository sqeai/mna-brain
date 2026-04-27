import { asc, eq, ilike } from 'drizzle-orm';
import { users } from '@/lib/db/schema';
import type { DbClient, Tables, TablesInsert, TablesUpdate } from './types';

export type UserListItem = Pick<Tables<'users'>, 'id' | 'name' | 'email' | 'role'>;

export class UserRepository {
  constructor(private readonly db: DbClient) {}

  async findAll(): Promise<UserListItem[]> {
    return this.db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .orderBy(asc(users.name));
  }

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


  async update(id: string, updates: TablesUpdate<'users'>): Promise<void> {
    await this.db.update(users).set(updates).where(eq(users.id, id));
  }
}
