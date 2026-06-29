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

interface ApiColumn {
  id: string;
  name: string;
  cards: Array<{ id: string; title: string; position: number; priority: string }>;
}

/** Fetch the user's columns (with cards) via the board API. */
async function getColumns(token: string): Promise<ApiColumn[]> {
  const res = await request(app).get('/api/board').set('Authorization', `Bearer ${token}`);
  return res.body.board.columns as ApiColumn[];
}

beforeEach(async () => {
  await resetDb();
});

describe('POST /api/cards', () => {
  it('creates a card with defaults and appends at the next position', async () => {
    const { token } = await registerUser('alice@example.com');
    const [todo] = await getColumns(token);

    const first = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: todo.id, title: 'First task' });

    expect(first.status).toBe(201);
    expect(first.body.card).toMatchObject({
      title: 'First task',
      priority: 'MEDIUM',
      position: 0,
    });
    expect(first.body.card.description).toBeNull();
    expect(first.body.card.dueDate).toBeNull();

    const second = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: todo.id, title: 'Second task' });
    expect(second.body.card.position).toBe(1);
  });

  it('accepts optional description, priority and dueDate', async () => {
    const { token } = await registerUser('bob@example.com');
    const [todo] = await getColumns(token);

    const res = await request(app).post('/api/cards').set('Authorization', `Bearer ${token}`).send({
      columnId: todo.id,
      title: 'Detailed',
      description: 'Some details',
      priority: 'HIGH',
      dueDate: '2026-07-01T00:00:00.000Z',
    });

    expect(res.status).toBe(201);
    expect(res.body.card).toMatchObject({
      description: 'Some details',
      priority: 'HIGH',
    });
    expect(res.body.card.dueDate).toBe('2026-07-01T00:00:00.000Z');
  });

  it('rejects a missing title (400)', async () => {
    const { token } = await registerUser('carol@example.com');
    const [todo] = await getColumns(token);

    const res = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: todo.id, title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an invalid priority (400)', async () => {
    const { token } = await registerUser('dan@example.com');
    const [todo] = await getColumns(token);

    const res = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: todo.id, title: 'X', priority: 'URGENT' });

    expect(res.status).toBe(400);
  });

  it("rejects creating in another user's column (404)", async () => {
    const owner = await registerUser('owner@example.com');
    const attacker = await registerUser('attacker@example.com');
    const [ownerCol] = await getColumns(owner.token);

    const res = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${attacker.token}`)
      .send({ columnId: ownerCol.id, title: 'Intrusion' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('COLUMN_NOT_FOUND');
  });
});

describe('GET /api/board (cards included)', () => {
  it('returns cards ordered by position within each column', async () => {
    const { token } = await registerUser('erin@example.com');
    const [todo] = await getColumns(token);

    for (const title of ['A', 'B', 'C']) {
      await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${token}`)
        .send({ columnId: todo.id, title });
    }

    const columns = await getColumns(token);
    const refreshed = columns.find((c) => c.id === todo.id);
    expect(refreshed?.cards.map((c) => c.title)).toEqual(['A', 'B', 'C']);
    expect(refreshed?.cards.map((c) => c.position)).toEqual([0, 1, 2]);
  });
});

describe('PATCH /api/cards/:id', () => {
  it('edits a card the user owns', async () => {
    const { token } = await registerUser('frank@example.com');
    const [todo] = await getColumns(token);
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: todo.id, title: 'Old' });
    const cardId = created.body.card.id as string;

    const res = await request(app)
      .patch(`/api/cards/${cardId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New', priority: 'LOW', description: 'desc' });

    expect(res.status).toBe(200);
    expect(res.body.card).toMatchObject({ title: 'New', priority: 'LOW', description: 'desc' });
  });

  it('clears a nullable field when sent null', async () => {
    const { token } = await registerUser('gwen@example.com');
    const [todo] = await getColumns(token);
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: todo.id, title: 'Has date', dueDate: '2026-07-01T00:00:00.000Z' });
    const cardId = created.body.card.id as string;

    const res = await request(app)
      .patch(`/api/cards/${cardId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dueDate: null });

    expect(res.status).toBe(200);
    expect(res.body.card.dueDate).toBeNull();
  });

  it('rejects an empty update (400)', async () => {
    const { token } = await registerUser('hugo@example.com');
    const [todo] = await getColumns(token);
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: todo.id, title: 'X' });

    const res = await request(app)
      .patch(`/api/cards/${created.body.card.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/cards/:id', () => {
  it('deletes a card the user owns', async () => {
    const { token } = await registerUser('ivy@example.com');
    const [todo] = await getColumns(token);
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: todo.id, title: 'Doomed' });
    const cardId = created.body.card.id as string;

    const res = await request(app)
      .delete(`/api/cards/${cardId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    const stored = await prisma.card.findUnique({ where: { id: cardId } });
    expect(stored).toBeNull();
  });
});

describe('cross-user isolation (FR-3)', () => {
  it("cannot edit or delete another user's card", async () => {
    const owner = await registerUser('owner2@example.com');
    const attacker = await registerUser('attacker2@example.com');
    const [ownerCol] = await getColumns(owner.token);
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ columnId: ownerCol.id, title: 'Private' });
    const cardId = created.body.card.id as string;

    const edit = await request(app)
      .patch(`/api/cards/${cardId}`)
      .set('Authorization', `Bearer ${attacker.token}`)
      .send({ title: 'Hacked' });
    expect(edit.status).toBe(404);
    expect(edit.body.error.code).toBe('CARD_NOT_FOUND');

    const del = await request(app)
      .delete(`/api/cards/${cardId}`)
      .set('Authorization', `Bearer ${attacker.token}`);
    expect(del.status).toBe(404);

    const stored = await prisma.card.findUnique({ where: { id: cardId } });
    expect(stored?.title).toBe('Private');
  });
});
