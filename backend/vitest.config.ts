import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './tests/globalSetup.ts',
    // Run test files sequentially: they share one SQLite test database.
    fileParallelism: false,
    // Ensure test workers (which import the Prisma singleton) use the test DB.
    env: {
      DATABASE_URL: 'file:./test.db',
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '1h',
    },
  },
});
