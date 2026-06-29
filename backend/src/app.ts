/**
 * Express application factory.
 *
 * Builds and configures the app (middleware + routes) without starting an HTTP
 * listener, so it can be imported directly by tests (Supertest) and by the
 * server entrypoint alike.
 */
import express, { type Application } from 'express';
import cors from 'cors';

import { env } from './config/env.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { boardRouter } from './modules/board/board.routes.js';
import { columnRouter } from './modules/column/column.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp(): Application {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  // All API routes are namespaced under /api.
  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/board', boardRouter);
  app.use('/api/columns', columnRouter);

  // 404 for unmatched routes, then the central error handler (must be last).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
