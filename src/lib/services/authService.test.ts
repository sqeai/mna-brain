import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResetPasswordTokenRepository, UserRepository } from '@/lib/repositories';
import type { Tables } from '@/lib/repositories';
import { AuthService } from './authService';
import { hashPassword } from './password';

type User = Tables<'users'>;
type ResetToken = Tables<'reset_password_tokens'>;

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    password: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as User;
}

function makeUserRepoStub(): UserRepository {
  return {
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findFavoriteCompanies: vi.fn(),
  } as unknown as UserRepository;
}

function makeTokenRepoStub(): ResetPasswordTokenRepository {
  return {
    create: vi.fn(),
    findValidByToken: vi.fn(),
    deleteByToken: vi.fn(),
  } as unknown as ResetPasswordTokenRepository;
}

describe('AuthService.signIn', () => {
  let userRepo: UserRepository;
  let service: AuthService;

  beforeEach(() => {
    userRepo = makeUserRepoStub();
    service = new AuthService(userRepo, makeTokenRepoStub());
  });

  it('throws when user is not found', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(undefined);
    await expect(service.signIn('nobody@example.com', 'pw')).rejects.toThrow('Invalid email or password');
  });

  it('throws when password is wrong', async () => {
    const hash = await hashPassword('correct');
    vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser({ password: hash }));
    await expect(service.signIn('test@example.com', 'wrong')).rejects.toThrow('Invalid email or password');
  });

  it('returns the user on correct credentials', async () => {
    const hash = await hashPassword('correct');
    const user = makeUser({ password: hash });
    vi.mocked(userRepo.findByEmail).mockResolvedValue(user);
    const result = await service.signIn('test@example.com', 'correct');
    expect(result).toBe(user);
  });
});

describe('AuthService.signUp', () => {
  let userRepo: UserRepository;
  let service: AuthService;

  beforeEach(() => {
    userRepo = makeUserRepoStub();
    service = new AuthService(userRepo, makeTokenRepoStub());
    vi.mocked(userRepo.findByEmail).mockResolvedValue(undefined);
  });

  it('throws when required fields are missing', async () => {
    await expect(service.signUp('', 'name', 'pw')).rejects.toThrow('required');
    await expect(service.signUp('a@b.com', '', 'pw')).rejects.toThrow('required');
    await expect(service.signUp('a@b.com', 'name', '')).rejects.toThrow('required');
  });

  it('throws when email is already registered', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser());
    await expect(service.signUp('test@example.com', 'name', 'pw')).rejects.toThrow('already registered');
  });

  it('normalizes email to lowercase and trims whitespace before lookup', async () => {
    await service.signUp('  User@Example.COM  ', 'name', 'password');
    expect(userRepo.findByEmail).toHaveBeenCalledWith('user@example.com');
  });

  it('stores a hashed password, not the plaintext', async () => {
    await service.signUp('new@example.com', 'name', 'mypassword');
    const createCall = vi.mocked(userRepo.create).mock.calls[0][0];
    expect(createCall.password).not.toBe('mypassword');
    expect(createCall.password).toMatch(/^scrypt\$/);
  });
});

describe('AuthService.forgetPassword', () => {
  let userRepo: UserRepository;
  let tokenRepo: ResetPasswordTokenRepository;
  let service: AuthService;

  beforeEach(() => {
    userRepo = makeUserRepoStub();
    tokenRepo = makeTokenRepoStub();
    service = new AuthService(userRepo, tokenRepo);
  });

  it('returns a token even for unknown emails (timing-safety: no email enumeration)', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(undefined);
    const token = await service.forgetPassword('nobody@example.com');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    expect(tokenRepo.create).not.toHaveBeenCalled();
  });

  it('stores the token and returns it for a known user', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser({ id: 'user-1' }));
    const token = await service.forgetPassword('test@example.com');
    expect(tokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ token, user_id: 'user-1' }),
    );
  });
});

describe('AuthService.resetPassword', () => {
  let userRepo: UserRepository;
  let tokenRepo: ResetPasswordTokenRepository;
  let service: AuthService;

  beforeEach(() => {
    userRepo = makeUserRepoStub();
    tokenRepo = makeTokenRepoStub();
    service = new AuthService(userRepo, tokenRepo);
  });

  it('throws when key or password is empty', async () => {
    await expect(service.resetPassword('', 'pw')).rejects.toThrow('required');
    await expect(service.resetPassword('key', '')).rejects.toThrow('required');
  });

  it('throws for an invalid or expired token', async () => {
    vi.mocked(tokenRepo.findValidByToken).mockResolvedValue(undefined);
    await expect(service.resetPassword('bad-token', 'newpw')).rejects.toThrow('Invalid or expired');
  });

  it('updates the password and deletes the token on success', async () => {
    const tokenRow = {
      id: 'tok-1',
      token: 'valid-token',
      user_id: 'user-1',
      valid_until: new Date(Date.now() + 60_000).toISOString(),
      created_at: new Date().toISOString(),
    } as ResetToken;
    vi.mocked(tokenRepo.findValidByToken).mockResolvedValue(tokenRow);

    await service.resetPassword('valid-token', 'newpassword');

    expect(userRepo.update).toHaveBeenCalledWith('user-1', expect.objectContaining({ password: expect.stringMatching(/^scrypt\$/) }));
    expect(tokenRepo.deleteByToken).toHaveBeenCalledWith('valid-token');
  });
});
