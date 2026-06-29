/**
 * Auth provider: owns the current user + token lifecycle.
 *
 * On mount, if a token is persisted it bootstraps the session by calling
 * `/auth/me`; an invalid/expired token is discarded. login/register persist
 * the returned token and set the user; logout clears both.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import * as authApi from '../lib/authApi';
import type { AuthUser, Credentials } from '../lib/authApi';
import { clearStoredToken, getStoredToken, setStoredToken } from '../lib/token';
import { AuthContext, type AuthContextValue } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Bootstrap: validate any persisted token against the API on first load.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!getStoredToken()) {
        setIsInitializing(false);
        return;
      }
      try {
        const { user: me } = await authApi.fetchMe();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        // Token is invalid/expired — drop it and stay logged out.
        clearStoredToken();
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: Credentials) => {
    const { token, user: authed } = await authApi.login(credentials);
    setStoredToken(token);
    setUser(authed);
  }, []);

  const register = useCallback(async (credentials: Credentials) => {
    const { token, user: created } = await authApi.register(credentials);
    setStoredToken(token);
    setUser(created);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isInitializing,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, isInitializing, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
