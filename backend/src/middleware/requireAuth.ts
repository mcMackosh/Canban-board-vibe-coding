/**
 * Auth guard middleware.
 *
 * Verifies the `Authorization: Bearer <JWT>` header, attaches `req.userId`,
 * and rejects missing/invalid tokens with 401 via the error pipeline.
 */
import { type RequestHandler } from 'express';

import { verifyToken } from '../lib/jwt.js';
import { UnauthorizedError } from '../lib/errors.js';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or malformed Authorization header'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const { userId } = verifyToken(token);
    req.userId = userId;
    next();
  } catch (err) {
    next(err);
  }
};
