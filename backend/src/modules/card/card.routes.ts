/** Card routes: /api/cards */
import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { postCard, patchCard, removeCard } from './card.controller.js';

export const cardRouter = Router();

cardRouter.post('/', requireAuth, asyncHandler(postCard));
cardRouter.patch('/:id', requireAuth, asyncHandler(patchCard));
cardRouter.delete('/:id', requireAuth, asyncHandler(removeCard));
