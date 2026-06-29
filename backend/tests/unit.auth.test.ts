import { describe, it, expect } from 'vitest';

import { hashPassword, verifyPassword } from '../src/lib/password.js';
import { signToken, verifyToken } from '../src/lib/jwt.js';

describe('password hashing', () => {
  it('hashes a password to something other than plaintext', async () => {
    const hash = await hashPassword('supersecret');
    expect(hash).not.toBe('supersecret');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifies a correct password and rejects a wrong one', async () => {
    const hash = await hashPassword('supersecret');
    expect(await verifyPassword('supersecret', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});

describe('jwt issue/verify', () => {
  it('round-trips the userId', () => {
    const token = signToken({ userId: 'user_123' });
    expect(typeof token).toBe('string');
    expect(verifyToken(token)).toEqual({ userId: 'user_123' });
  });

  it('rejects a tampered/invalid token', () => {
    expect(() => verifyToken('not-a-real-token')).toThrowError();
  });
});
