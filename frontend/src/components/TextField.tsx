/** Labeled text input with inline error display + accessible wiring. */
import { useId, type InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function TextField({ label, error, id, ...inputProps }: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-text">
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`rounded-card border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40 ${
          error ? 'border-priority-high' : 'border-border'
        }`}
        {...inputProps}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-priority-high">
          {error}
        </p>
      ) : null}
    </div>
  );
}
