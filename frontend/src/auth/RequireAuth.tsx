/**
 * Route guard: renders protected children only for authenticated users.
 *
 * While the session is bootstrapping it shows a lightweight loading state; once
 * settled, unauthenticated users are redirected to /login (preserving where
 * they were headed so login can send them back).
 */
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

import { useAuth } from './useAuth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div
        role="status"
        className="flex min-h-screen items-center justify-center text-sm text-text-muted"
      >
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
