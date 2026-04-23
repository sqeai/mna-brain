import { randomBytes } from 'crypto';
import type { ResetPasswordTokenRepository, UserRepository } from '@/lib/repositories';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly resetTokenRepo: ResetPasswordTokenRepository,
  ) {}

  async signIn(email: string, password: string) {
    const user = await this.userRepo.findByEmailAndPassword(email, password);
    if (!user) throw new Error('Invalid email or password');
    return user;
  }

  async signUp(email: string, name: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !name || !password) {
      throw new Error('Email, name, and password are required');
    }
    const existing = await this.userRepo.findByEmail(normalizedEmail);
    if (existing) throw new Error('Email already registered');
    await this.userRepo.create({ email: normalizedEmail, name, password });
  }

  async forgetPassword(email: string): Promise<string> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user) throw new Error('Email not found');
    const token = randomBytes(24).toString('hex');
    const validUntil = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
    await this.resetTokenRepo.create({
      token,
      user_id: user.id,
      valid_until: validUntil,
    });
    return token;
  }

  async resetPassword(key: string, password: string): Promise<void> {
    if (!key || !password) throw new Error('Key and password are required');
    const row = await this.resetTokenRepo.findValidByToken(key);
    if (!row) throw new Error('Invalid or expired reset token');
    await this.userRepo.update(row.user_id, { password });
    await this.resetTokenRepo.deleteByToken(key);
  }
}
