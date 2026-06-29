/** Auth routes: /api/auth/* */
import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { register, login, logout, me } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', asyncHandler(register));
authRouter.post('/login', asyncHandler(login));
authRouter.post('/logout', asyncHandler(logout));
authRouter.get('/me', requireAuth, asyncHandler(me));
