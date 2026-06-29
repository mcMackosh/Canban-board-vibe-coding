/**
 * Client-side auth form validation, mirroring the backend Zod rules so users
 * get instant feedback. The server remains the source of truth.
 */

/** Minimum password length accepted at registration (matches backend). */
export const MIN_PASSWORD_LENGTH = 8;

// Pragmatic email shape check; the backend performs authoritative validation.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface FieldErrors {
  email?: string;
  password?: string;
}

/** Validate an email; returns an error message or undefined when valid. */
export function validateEmail(email: string): string | undefined {
  if (!email.trim()) {
    return 'Email is required';
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    return 'Enter a valid email address';
  }
  return undefined;
}

/** Validate a registration password (length enforced). */
export function validateNewPassword(password: string): string | undefined {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return undefined;
}

/** Validate a login password (presence only — server verifies the rest). */
export function validateLoginPassword(password: string): string | undefined {
  return password ? undefined : 'Password is required';
}
