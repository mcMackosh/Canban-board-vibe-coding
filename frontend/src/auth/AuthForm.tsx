/**
 * Shared email+password auth form used by both Login and Register pages.
 *
 * Owns local field state, runs the supplied validators on submit, surfaces
 * per-field errors and a top-level form error, and disables while submitting.
 */
import { useState, type FormEvent } from 'react';

import { ApiError } from '../lib/api';
import { TextField } from '../components/TextField';
import { validateEmail, type FieldErrors } from './validation';

interface AuthFormProps {
  /** Submit button label, e.g. "Log in" / "Create account". */
  submitLabel: string;
  /** `autoComplete` for the password field ("new-password" vs "current-password"). */
  passwordAutoComplete: 'new-password' | 'current-password';
  /** Validator for the password field (rules differ between login/register). */
  validatePassword: (password: string) => string | undefined;
  /** Called with validated credentials; should resolve on success or throw. */
  onSubmit: (credentials: { email: string; password: string }) => Promise<void>;
}

export function AuthForm({
  submitLabel,
  passwordAutoComplete,
  validatePassword,
  onSubmit,
}: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors: FieldErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    if (errors.email || errors.password) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      await onSubmit({ email: email.trim(), password });
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError ? (
        <div
          role="alert"
          className="rounded-card border border-priority-high/40 bg-priority-high/10 px-3 py-2 text-sm text-priority-high"
        >
          {formError}
        </div>
      ) : null}

      <TextField
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        placeholder="you@example.com"
      />

      <TextField
        label="Password"
        type="password"
        name="password"
        autoComplete={passwordAutoComplete}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        placeholder="••••••••"
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded-card bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Please wait…' : submitLabel}
      </button>
    </form>
  );
}
