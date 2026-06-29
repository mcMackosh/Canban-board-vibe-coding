/**
 * Central error-handling middleware.
 *
 * Maps thrown errors to a safe JSON shape `{ error: { code, message } }`.
 * Never leaks stack traces or internal details to the client (AGENTS.md §5.4).
 */
import { type ErrorRequestHandler, type RequestHandler } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../lib/errors.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Zod validation failures → 400 with a readable message.
  if (err instanceof ZodError) {
    const message = err.issues.map((i) => i.message).join('; ');
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message } });
    return;
  }

  // Known application errors carry their own status + code.
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }

  // Anything else is unexpected — log server-side, return a generic 500.
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
};

/** Fallback 404 handler for unmatched routes. */
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
};
