/**
 * Typed fetch wrapper for the backend API.
 *
 * Attaches the JWT (when present) as `Authorization: Bearer <token>` and
 * normalizes the backend's `{ error: { code, message } }` shape into a thrown
 * `ApiError` so callers can branch on `code` and show `message`.
 */
import { getStoredToken } from './token';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

/** Error thrown for any non-2xx API response, carrying the backend's code. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  /** Send the stored JWT in the Authorization header. */
  auth?: boolean;
  body?: unknown;
}

async function request<T>(
  method: string,
  path: string,
  { auth = false, body }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth) {
    const token = getStoredToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Network-level failure (server down, DNS, CORS preflight, …).
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server');
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const data = (await res.json().catch(() => null)) as {
    error?: { code?: string; message?: string };
  } | null;

  if (!res.ok) {
    const code = data?.error?.code ?? 'UNKNOWN_ERROR';
    const message = data?.error?.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, code, message);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('POST', path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PATCH', path, { ...opts, body }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
};
