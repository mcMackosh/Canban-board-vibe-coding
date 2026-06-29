/**
 * Board service: provisioning + reads.
 *
 * Holds the board business logic; the only layer that touches Prisma for the
 * board domain (AGENTS.md §5.4). Every read is scoped by the authenticated
 * userId to guarantee isolation (FR-3).
 */
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import type { Prisma } from '@prisma/client';

/** The three starter columns provisioned for a new user (FR-4). */
export const DEFAULT_COLUMN_NAMES = ['To Do', 'In Progress', 'Done'] as const;

/**
 * Create the user's default board + starter columns in a single transaction
 * (FR-4). Called from the register flow right after the user is created.
 *
 * Accepts a transaction client so it can run inside the registration
 * transaction; falls back to the shared client for standalone use.
 */
export async function provisionDefaultBoard(
  userId: string,
  client: Prisma.TransactionClient = prisma,
): Promise<void> {
  await client.board.create({
    data: {
      userId,
      name: 'My Board',
      columns: {
        create: DEFAULT_COLUMN_NAMES.map((name, index) => ({
          name,
          position: index,
        })),
      },
    },
  });
}

/** Fetch the authenticated user's board with its columns, ordered by position. */
export async function getBoardForUser(userId: string) {
  const board = await prisma.board.findUnique({
    where: { userId },
    include: {
      columns: {
        orderBy: { position: 'asc' },
        include: {
          cards: {
            orderBy: { position: 'asc' },
          },
        },
      },
    },
  });

  if (!board) {
    // Every user is provisioned a board at registration, so a missing board
    // means data corruption or a stale token — surface as not found.
    throw new NotFoundError('Board not found', 'BOARD_NOT_FOUND');
  }

  return board;
}
