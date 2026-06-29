/**
 * Auth service: business logic for registration and login.
 *
 * Holds no HTTP concerns — controllers translate these results to responses.
 * The only layer that touches Prisma (AGENTS.md §5.4).
 */
import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { signToken } from '../../lib/jwt.js';
import { ConflictError, UnauthorizedError } from '../../lib/errors.js';
import { provisionDefaultBoard } from '../board/board.service.js';
import type { RegisterInput, LoginInput } from './auth.schemas.js';

export interface AuthResult {
  token: string;
  user: { id: string; email: string };
}

/** Register a new user with a hashed password, then issue a token. */
export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError('An account with this email already exists', 'EMAIL_TAKEN');
  }

  const passwordHash = await hashPassword(input.password);

  // Create the user and provision their default board + starter columns in a
  // single transaction (FR-4): either the whole account setup succeeds or none
  // of it persists.
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { email: input.email, passwordHash },
    });
    await provisionDefaultBoard(created.id, tx);
    return created;
  });

  const token = signToken({ userId: user.id });
  return { token, user: { id: user.id, email: user.email } };
}

/** Verify credentials and issue a token, or fail with 401. */
export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const token = signToken({ userId: user.id });
  return { token, user: { id: user.id, email: user.email } };
}

/** Fetch the current user's public profile by id. */
export async function getUserById(userId: string): Promise<{ id: string; email: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new UnauthorizedError('User no longer exists');
  }
  return { id: user.id, email: user.email };
}
