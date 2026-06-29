/** Wraps an async route handler so thrown/rejected errors reach Express's error pipeline. */
import { type RequestHandler } from 'express';

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
