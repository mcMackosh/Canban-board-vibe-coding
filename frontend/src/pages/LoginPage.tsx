/** Login page: authenticates an existing user, then redirects to the board. */
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AuthForm } from '../auth/AuthForm';
import { AuthLayout } from '../auth/AuthLayout';
import { useAuth } from '../auth/useAuth';
import { validateLoginPassword } from '../auth/validation';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Return the user to wherever the auth guard intercepted them, else the board.
  const from = (location.state as { from?: string } | null)?.from ?? '/board';

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your Kanban board."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary-700">
            Create one
          </Link>
        </>
      }
    >
      <AuthForm
        submitLabel="Log in"
        passwordAutoComplete="current-password"
        validatePassword={validateLoginPassword}
        onSubmit={async (credentials) => {
          await login(credentials);
          navigate(from, { replace: true });
        }}
      />
    </AuthLayout>
  );
}
