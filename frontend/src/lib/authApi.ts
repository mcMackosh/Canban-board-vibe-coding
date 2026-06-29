/** Typed auth API calls matching the backend `/api/auth/*` surface. */
import { api } from './api';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

export interface Credentials {
  email: string;
  password: string;
}

/** POST /auth/register — create a user + default board, return token + user. */
export function register(credentials: Credentials): Promise<AuthResult> {
  return api.post<AuthResult>('/auth/register', credentials);
}

/** POST /auth/login — authenticate, return token + user. */
export function login(credentials: Credentials): Promise<AuthResult> {
  return api.post<AuthResult>('/auth/login', credentials);
}

/** GET /auth/me — fetch the current user using the stored token. */
export function fetchMe(): Promise<{ user: AuthUser }> {
  return api.get<{ user: AuthUser }>('/auth/me', { auth: true });
}
