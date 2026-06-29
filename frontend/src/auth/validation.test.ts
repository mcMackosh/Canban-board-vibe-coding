import { describe, it, expect } from 'vitest';

import {
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validateLoginPassword,
  validateNewPassword,
} from './validation';

describe('validateEmail', () => {
  it('rejects empty input', () => {
    expect(validateEmail('')).toBe('Email is required');
    expect(validateEmail('   ')).toBe('Email is required');
  });

  it('rejects malformed addresses', () => {
    expect(validateEmail('not-an-email')).toBeDefined();
    expect(validateEmail('foo@bar')).toBeDefined();
    expect(validateEmail('foo@bar.')).toBeDefined();
  });

  it('accepts a valid address (trimming surrounding space)', () => {
    expect(validateEmail('alice@example.com')).toBeUndefined();
    expect(validateEmail('  alice@example.com  ')).toBeUndefined();
  });
});

describe('validateNewPassword', () => {
  it('requires a password', () => {
    expect(validateNewPassword('')).toBe('Password is required');
  });

  it('enforces the minimum length', () => {
    expect(validateNewPassword('short')).toBe(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  });

  it('accepts a sufficiently long password', () => {
    expect(validateNewPassword('password123')).toBeUndefined();
  });
});

describe('validateLoginPassword', () => {
  it('only requires presence', () => {
    expect(validateLoginPassword('')).toBe('Password is required');
    expect(validateLoginPassword('x')).toBeUndefined();
  });
});
