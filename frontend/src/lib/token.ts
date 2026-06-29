/** JWT persistence in localStorage. Single place that touches token storage. */

const TOKEN_KEY = 'kanban.authToken';

/** Read the persisted auth token, or null if none is stored. */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // localStorage can throw in private-mode / disabled-storage environments.
    return null;
  }
}

/** Persist the auth token (after a successful login/register). */
export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Non-fatal: the in-memory token still drives the current session.
  }
}

/** Remove the persisted auth token (on logout or auth failure). */
export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Non-fatal.
  }
}
