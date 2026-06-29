import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import * as authApi from '../lib/authApi';
import { ApiError } from '../lib/api';
import { setStoredToken } from '../lib/token';
import { AuthProvider } from './AuthProvider';
import { RequireAuth } from './RequireAuth';

vi.mock('../lib/authApi');
const mockedFetchMe = vi.mocked(authApi.fetchMe);

/** Render a guarded /board route plus a public /login landing target. */
function renderGuarded() {
  return render(
    <MemoryRouter initialEntries={['/board']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route
            path="/board"
            element={
              <RequireAuth>
                <p>Secret board</p>
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('redirects an unauthenticated visitor to /login', async () => {
    renderGuarded();

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Secret board')).not.toBeInTheDocument();
    // No token → no bootstrap call.
    expect(mockedFetchMe).not.toHaveBeenCalled();
  });

  it('discards an invalid token and redirects to /login', async () => {
    setStoredToken('bad-token');
    mockedFetchMe.mockRejectedValueOnce(new ApiError(401, 'UNAUTHORIZED', 'nope'));

    renderGuarded();

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(localStorage.getItem('kanban.authToken')).toBeNull();
  });

  it('renders the protected content for a valid token', async () => {
    setStoredToken('good-token');
    mockedFetchMe.mockResolvedValueOnce({
      user: { id: 'u1', email: 'alice@example.com' },
    });

    renderGuarded();

    expect(await screen.findByText('Secret board')).toBeInTheDocument();
  });
});
