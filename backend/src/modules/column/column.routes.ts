/** Column routes: /api/columns */
import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { postColumn, patchColumn, removeColumn } from './column.controller.js';

export const columnRouter = Router();

columnRouter.post('/', requireAuth, asyncHandler(postColumn));
columnRouter.patch('/:id', requireAuth, asyncHandler(patchColumn));
columnRouter.delete('/:id', requireAuth, asyncHandler(removeColumn));
