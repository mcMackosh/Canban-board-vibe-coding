/** Auth context definition (shared by the provider and the `useAuth` hook). */
import { createContext } from 'react';

import type { AuthUser, Credentials } from '../lib/authApi';

export interface AuthContextValue {
  /** The authenticated user, or null when logged out. */
  user: AuthUser | null;
  /** True while the initial token → user bootstrap is in flight. */
  isInitializing: boolean;
  /** True once a user is present. */
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  register: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
