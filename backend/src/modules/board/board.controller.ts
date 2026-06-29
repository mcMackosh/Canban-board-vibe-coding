/** Board controller: resolve the authed user, call the service, shape the response. */
import { type RequestHandler } from 'express';

import { UnauthorizedError } from '../../lib/errors.js';
import { getBoardForUser } from './board.service.js';

/** GET /api/board — the authenticated user's board with ordered columns. */
export const getBoard: RequestHandler = async (req, res) => {
  if (!req.userId) {
    throw new UnauthorizedError();
  }
  const board = await getBoardForUser(req.userId);
  res.status(200).json({ board });
};
