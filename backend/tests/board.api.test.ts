import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { resetDb } from './helpers.js';

const app = createApp();

/** Register a fresh user and return their token + id. */
async function registerUser(email: string) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123' });
  return { token: res.body.token as string, userId: res.body.user.id as string };
}

beforeEach(async () => {
  await resetDb();
});

describe('default board provisioning (FR-4)', () => {
  it('creates a board with the three starter columns on register', async () => {
    const { userId } = await registerUser('alice@example.com');

    const board = await prisma.board.findUnique({
      where: { userId },
      include: { columns: { orderBy: { position: 'asc' } } },
    });

    expect(board).not.toBeNull();
    expect(board?.columns.map((c) => c.name)).toEqual(['To Do', 'In Progress', 'Done']);
    expect(board?.columns.map((c) => c.position)).toEqual([0, 1, 2]);
  });
});

describe('GET /api/board', () => {
  it('returns the board with ordered columns for the owner', async () => {
    const { token } = await registerUser('bob@example.com');

    const res = await request(app).get('/api/board').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.board.columns).toHaveLength(3);
    expect(res.body.board.columns.map((c: { name: string }) => c.name)).toEqual([
      'To Do',
      'In Progress',
      'Done',
    ]);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/board');
    expect(res.status).toBe(401);
  });
});
