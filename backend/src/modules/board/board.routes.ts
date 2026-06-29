/** Board routes: /api/board */
import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { getBoard } from './board.controller.js';

export const boardRouter = Router();

boardRouter.get('/', requireAuth, asyncHandler(getBoard));
