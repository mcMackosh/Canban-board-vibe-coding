/**
 * Card service: create / edit / delete.
 *
 * Every operation is scoped to the authenticated user's board so a user can
 * never read or mutate another user's cards (FR-3). The only layer that touches
 * Prisma for the card domain (AGENTS.md §5.4).
 */
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import type { CreateCardInput, UpdateCardInput } from './card.schemas.js';

/** Load a column only if it belongs to the user's board (ownership check). */
async function getOwnedColumn(userId: string, columnId: string) {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: { board: { select: { userId: true } } },
  });
  if (!column || column.board.userId !== userId) {
    throw new NotFoundError('Column not found', 'COLUMN_NOT_FOUND');
  }
  return column;
}

/** Load a card only if it belongs to the user's board (ownership check). */
async function getOwnedCard(userId: string, cardId: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { column: { include: { board: { select: { userId: true } } } } },
  });
  if (!card || card.column.board.userId !== userId) {
    throw new NotFoundError('Card not found', 'CARD_NOT_FOUND');
  }
  return card;
}

/** Create a card, appended to the end of its column (FR-14 order on create). */
export async function createCard(userId: string, input: CreateCardInput) {
  await getOwnedColumn(userId, input.columnId);

  const last = await prisma.card.findFirst({
    where: { columnId: input.columnId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  const position = last ? last.position + 1 : 0;

  return prisma.card.create({
    data: {
      columnId: input.columnId,
      title: input.title,
      description: input.description,
      priority: input.priority ?? 'MEDIUM',
      dueDate: input.dueDate ?? null,
      position,
    },
  });
}

/** Edit a card's fields (title/description/priority/dueDate) the user owns. */
export async function updateCard(userId: string, cardId: string, input: UpdateCardInput) {
  await getOwnedCard(userId, cardId);

  return prisma.card.update({
    where: { id: cardId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    },
  });
}

/** Delete a card the user owns. */
export async function deleteCard(userId: string, cardId: string): Promise<void> {
  await getOwnedCard(userId, cardId);
  await prisma.card.delete({ where: { id: cardId } });
}
