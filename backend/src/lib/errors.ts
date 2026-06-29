/**
 * Typed application errors.
 *
 * Services and controllers throw these; the central error-handling middleware
 * maps them to an HTTP status + a safe `{ error: { code, message } }` body.
 */

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** 400 — request body/params failed validation. */
export class ValidationError extends AppError {
  constructor(message = 'Invalid request', code = 'VALIDATION_ERROR') {
    super(400, code, message);
  }
}

/** 401 — missing/invalid credentials or token. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(401, code, message);
  }
}

/** 409 — conflict, e.g. registering an email that already exists. */
export class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(409, code, message);
  }
}

/** 404 — resource not found (or not owned by the requester). */
export class NotFoundError extends AppError {
  constructor(message = 'Not found', code = 'NOT_FOUND') {
    super(404, code, message);
  }
}
