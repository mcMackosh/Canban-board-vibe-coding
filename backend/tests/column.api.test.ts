import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { resetDb } from './helpers.js';

const app = createApp();

async function registerUser(email: string) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123' });
  return { token: res.body.token as string, userId: res.body.user.id as string };
}

/** Fetch the user's columns ordered by position, via the API. */
async function getColumns(token: string) {
  const res = await request(app).get('/api/board').set('Authorization', `Bearer ${token}`);
  return res.body.board.columns as Array<{ id: string; name: string; position: number }>;
}

beforeEach(async () => {
  await resetDb();
});

describe('POST /api/columns', () => {
  it('appends a new column at the next position', async () => {
    const { token } = await registerUser('alice@example.com');

    const res = await request(app)
      .post('/api/columns')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Backlog' });

    expect(res.status).toBe(201);
    expect(res.body.column).toMatchObject({ name: 'Backlog', position: 3 });

    const columns = await getColumns(token);
    expect(columns).toHaveLength(4);
  });

  it('trims the name and rejects an empty one (400)', async () => {
    const { token } = await registerUser('bob@example.com');

    const ok = await request(app)
      .post('/api/columns')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '  Review  ' });
    expect(ok.body.column.name).toBe('Review');

    const bad = await request(app)
      .post('/api/columns')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '   ' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/columns').send({ name: 'Nope' });
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/columns/:id', () => {
  it('renames a column the user owns', async () => {
    const { token } = await registerUser('carol@example.com');
    const [first] = await getColumns(token);

    const res = await request(app)
      .patch(`/api/columns/${first.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ideas' });

    expect(res.status).toBe(200);
    expect(res.body.column.name).toBe('Ideas');
  });

  it('reorders a column by updating its position', async () => {
    const { token } = await registerUser('dave@example.com');
    const columns = await getColumns(token);
    const done = columns[2];

    const res = await request(app)
      .patch(`/api/columns/${done.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ position: 0 });

    expect(res.status).toBe(200);
    expect(res.body.column.position).toBe(0);
  });

  it('rejects an update with no fields (400)', async () => {
    const { token } = await registerUser('erin@example.com');
    const [first] = await getColumns(token);

    const res = await request(app)
      .patch(`/api/columns/${first.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/columns/:id', () => {
  it('deletes a column the user owns', async () => {
    const { token } = await registerUser('frank@example.com');
    const [first] = await getColumns(token);

    const res = await request(app)
      .delete(`/api/columns/${first.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    const remaining = await getColumns(token);
    expect(remaining).toHaveLength(2);
    expect(remaining.find((c) => c.id === first.id)).toBeUndefined();
  });
});

describe('cross-user isolation (FR-3)', () => {
  it("cannot rename another user's column", async () => {
    const owner = await registerUser('owner@example.com');
    const attacker = await registerUser('attacker@example.com');
    const [ownerColumn] = await getColumns(owner.token);

    const res = await request(app)
      .patch(`/api/columns/${ownerColumn.id}`)
      .set('Authorization', `Bearer ${attacker.token}`)
      .send({ name: 'Hacked' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('COLUMN_NOT_FOUND');

    // The owner's column is untouched.
    const stored = await prisma.column.findUnique({ where: { id: ownerColumn.id } });
    expect(stored?.name).toBe(ownerColumn.name);
  });

  it("cannot delete another user's column", async () => {
    const owner = await registerUser('owner2@example.com');
    const attacker = await registerUser('attacker2@example.com');
    const [ownerColumn] = await getColumns(owner.token);

    const res = await request(app)
      .delete(`/api/columns/${ownerColumn.id}`)
      .set('Authorization', `Bearer ${attacker.token}`);

    expect(res.status).toBe(404);
    const stored = await prisma.column.findUnique({ where: { id: ownerColumn.id } });
    expect(stored).not.toBeNull();
  });
});
