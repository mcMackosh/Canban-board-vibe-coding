/** Auth controllers: parse/validate input, call the service, shape the HTTP response. */
import { type RequestHandler } from 'express';

import { registerSchema, loginSchema } from './auth.schemas.js';
import { registerUser, loginUser, getUserById } from './auth.service.js';
import { UnauthorizedError } from '../../lib/errors.js';

export const register: RequestHandler = async (req, res) => {
  const input = registerSchema.parse(req.body);
  const result = await registerUser(input);
  res.status(201).json(result);
};

export const login: RequestHandler = async (req, res) => {
  const input = loginSchema.parse(req.body);
  const result = await loginUser(input);
  res.status(200).json(result);
};

/**
 * Logout is stateless: with JWTs the client simply discards the token. This
 * endpoint exists for symmetry and future-proofing (e.g. token denylist).
 */
export const logout: RequestHandler = (_req, res) => {
  res.status(200).json({ success: true });
};

/** Returns the authenticated user's profile (used by the frontend auth guard). */
export const me: RequestHandler = async (req, res) => {
  if (!req.userId) {
    throw new UnauthorizedError();
  }
  const user = await getUserById(req.userId);
  res.status(200).json({ user });
};
