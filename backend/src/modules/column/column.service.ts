/**
 * Column service: create / rename / reorder / delete.
 *
 * Every operation is scoped to the authenticated user's board so a user can
 * never read or mutate another user's columns (FR-3). The only layer that
 * touches Prisma for the column domain (AGENTS.md §5.4).
 */
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import type { CreateColumnInput, UpdateColumnInput } from './column.schemas.js';

/** Resolve the user's board id, or throw if they somehow have none. */
async function getBoardId(userId: string): Promise<string> {
  const board = await prisma.board.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!board) {
    throw new NotFoundError('Board not found', 'BOARD_NOT_FOUND');
  }
  return board.id;
}

/**
 * Load a column only if it belongs to the user's board. Centralizes the
 * ownership check used by rename/reorder/delete.
 */
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

/** Create a column, appended to the end of the board (next position). */
export async function createColumn(userId: string, input: CreateColumnInput) {
  const boardId = await getBoardId(userId);

  const last = await prisma.column.findFirst({
    where: { boardId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  const position = last ? last.position + 1 : 0;

  return prisma.column.create({
    data: { boardId, name: input.name, position },
  });
}

/** Rename and/or reposition a column the user owns. */
export async function updateColumn(userId: string, columnId: string, input: UpdateColumnInput) {
  await getOwnedColumn(userId, columnId);

  return prisma.column.update({
    where: { id: columnId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
    },
  });
}

/** Delete a column the user owns (its cards cascade via the schema). */
export async function deleteColumn(userId: string, columnId: string): Promise<void> {
  await getOwnedColumn(userId, columnId);
  await prisma.column.delete({ where: { id: columnId } });
}
