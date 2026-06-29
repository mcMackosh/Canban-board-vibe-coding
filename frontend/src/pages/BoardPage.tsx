/**
 * Protected board page.
 *
 * Reachable only when authenticated; shows the user's board with column
 * management (add / rename / delete) and a logout action.
 */
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/useAuth';
import { BoardView } from '../board/BoardView';

export function BoardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <h1 className="text-xl font-semibold text-text">Kanban Board</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-muted">{user?.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-card border border-border px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-bg"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="p-6">
        <BoardView />
      </main>
    </div>
  );
}
