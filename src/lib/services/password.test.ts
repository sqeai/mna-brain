import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('hashPassword', () => {
  it('produces a scrypt-formatted string', async () => {
    const hash = await hashPassword('secret');
    const parts = hash.split('$');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe('scrypt');
    expect(parts[1]).toHaveLength(32); // 16 bytes hex
    expect(parts[2]).toHaveLength(128); // 64 bytes hex
  });

  it('produces a different hash on each call (random salt)', async () => {
    const a = await hashPassword('secret');
    const b = await hashPassword('secret');
    expect(a).not.toBe(b);
  });
});

describe('verifyPassword', () => {
  it('returns true for the correct password', async () => {
    const hash = await hashPassword('correct');
    expect(await verifyPassword('correct', hash)).toBe(true);
  });

  it('returns false for a wrong password', async () => {
    const hash = await hashPassword('correct');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('returns false for a malformed stored string', async () => {
    expect(await verifyPassword('anything', 'notscrypt')).toBe(false);
    expect(await verifyPassword('anything', 'a$b')).toBe(false);
    expect(await verifyPassword('anything', 'sha256$aabb$ccdd')).toBe(false);
  });
});
