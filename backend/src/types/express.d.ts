/** Augment Express Request to carry the authenticated user id (set by requireAuth). */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
