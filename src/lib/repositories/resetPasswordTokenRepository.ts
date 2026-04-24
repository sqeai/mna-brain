import { and, eq, gt } from 'drizzle-orm';
import { resetPasswordTokens } from '@/lib/db/schema';
import type { DbClient, Tables, TablesInsert } from './types';

export class ResetPasswordTokenRepository {
  constructor(private readonly db: DbClient) {}

  async create(row: TablesInsert<'reset_password_tokens'>): Promise<void> {
    await this.db.insert(resetPasswordTokens).values(row);
  }

  async findValidByToken(token: string): Promise<Tables<'reset_password_tokens'> | null> {
    const nowIso = new Date().toISOString();
    const [row] = await this.db
      .select()
      .from(resetPasswordTokens)
      .where(and(eq(resetPasswordTokens.token, token), gt(resetPasswordTokens.valid_until, nowIso)))
      .limit(1);
    return row ?? null;
  }

  async deleteByToken(token: string): Promise<void> {
    await this.db.delete(resetPasswordTokens).where(eq(resetPasswordTokens.token, token));
  }
}
