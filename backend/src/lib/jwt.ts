/** JWT issue/verify helpers. Centralizes signing config and payload typing. */
import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '../config/env.js';
import { UnauthorizedError } from './errors.js';

export interface JwtPayload {
  userId: string;
}

/** Sign a JWT for the given user. */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  });
}

/** Verify and decode a JWT; throws UnauthorizedError if invalid/expired. */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (typeof decoded === 'string' || typeof decoded.userId !== 'string') {
      throw new UnauthorizedError('Invalid token payload');
    }
    return { userId: decoded.userId };
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
