/**
 * Vitest global setup: provisions an isolated SQLite test database so tests
 * never touch the development database. Runs `prisma migrate deploy` against a
 * fresh file, and removes it when the run finishes.
 */
import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(here, '..');
const TEST_DB_FILE = join(backendRoot, 'prisma', 'test.db');
const TEST_DB_URL = 'file:./test.db';

export default function setup() {
  // Point Prisma at the test database for the whole run.
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '1h';

  if (existsSync(TEST_DB_FILE)) {
    rmSync(TEST_DB_FILE);
  }

  // Apply the existing migrations to the fresh test database.
  execSync('npx prisma migrate deploy', {
    cwd: backendRoot,
    stdio: 'ignore',
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
  });

  // Teardown: remove the test database file after the run.
  return () => {
    if (existsSync(TEST_DB_FILE)) {
      rmSync(TEST_DB_FILE);
    }
  };
}
