import type { UserRepository } from '@/lib/repositories';

export class AuthService {
  constructor(private readonly userRepo: UserRepository) {}

  async signIn(email: string, password: string) {
    const user = await this.userRepo.findByEmailAndPassword(email, password);
    if (!user) throw new Error('Invalid email or password');
    return user;
  }
}
