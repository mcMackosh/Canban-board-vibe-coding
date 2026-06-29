import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ApiError } from '../lib/api';
import { AuthForm } from './AuthForm';
import { validateNewPassword } from './validation';

function renderForm(onSubmit: (c: { email: string; password: string }) => Promise<void>) {
  return render(
    <AuthForm
      submitLabel="Create account"
      passwordAutoComplete="new-password"
      validatePassword={validateNewPassword}
      onSubmit={onSubmit}
    />,
  );
}

describe('AuthForm', () => {
  it('shows field errors and does not submit when input is invalid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm(onSubmit);

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a too-short password', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm(onSubmit);

    await user.type(screen.getByLabelText('Email'), 'alice@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed credentials when valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm(onSubmit);

    await user.type(screen.getByLabelText('Email'), '  alice@example.com  ');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'password123',
    });
  });

  it('surfaces an API error message on failed submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValue(
        new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists'),
      );
    renderForm(onSubmit);

    await user.type(screen.getByLabelText('Email'), 'taken@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByText('An account with this email already exists'),
    ).toBeInTheDocument();
  });
});
