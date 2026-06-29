/** Shared test helpers. */
import { prisma } from '../src/lib/prisma.js';

/** Remove all users (cascades to boards/columns/cards) for a clean slate. */
export async function resetDb(): Promise<void> {
  await prisma.user.deleteMany();
}
