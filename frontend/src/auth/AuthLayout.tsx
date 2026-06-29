/** Centered card shell shared by the Login and Register pages. */
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Secondary line beneath the card (e.g. a link to the other auth page). */
  footer: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <div className="w-full max-w-md rounded-column bg-surface p-8 shadow-resting">
        <h1 className="text-2xl font-semibold text-text">{title}</h1>
        <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
      <p className="text-sm text-text-muted">{footer}</p>
    </main>
  );
}
