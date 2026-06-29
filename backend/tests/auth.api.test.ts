import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { resetDb } from './helpers.js';

const app = createApp();

beforeEach(async () => {
  await resetDb();
});

describe('POST /api/auth/register', () => {
  it('creates a user with a hashed password and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.body.user).toMatchObject({ email: 'alice@example.com' });
    expect(res.body.user.id).toBeTypeOf('string');

    // Password must be stored hashed, never in plaintext.
    const stored = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
    expect(stored).not.toBeNull();
    expect(stored?.passwordHash).toBeDefined();
    expect(stored?.passwordHash).not.toBe('password123');
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dupe@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dupe@example.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects an invalid body with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'bob@example.com', password: 'password123' });
  });

  it('returns a token for correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf('string');
  });

  it('returns 401 for a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 for an unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('GET /api/auth/me (protected)', () => {
  it('rejects requests without a token (401)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid token (401)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid token', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'carol@example.com', password: 'password123' });
    const token = reg.body.token as string;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: 'carol@example.com' });
  });
});
