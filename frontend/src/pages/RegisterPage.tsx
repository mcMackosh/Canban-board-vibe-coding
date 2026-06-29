/** Register page: creates an account, then redirects to the board. */
import { Link, useNavigate } from 'react-router-dom';

import { AuthForm } from '../auth/AuthForm';
import { AuthLayout } from '../auth/AuthLayout';
import { useAuth } from '../auth/useAuth';
import { validateNewPassword } from '../auth/validation';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Register to get a ready-to-use Kanban board."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-700">
            Log in
          </Link>
        </>
      }
    >
      <AuthForm
        submitLabel="Create account"
        passwordAutoComplete="new-password"
        validatePassword={validateNewPassword}
        onSubmit={async (credentials) => {
          await register(credentials);
          navigate('/board', { replace: true });
        }}
      />
    </AuthLayout>
  );
}
