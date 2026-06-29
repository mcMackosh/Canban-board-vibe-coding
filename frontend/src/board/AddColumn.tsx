/** Inline "add column" control: a button that expands into a name input. */
import { useState } from 'react';

interface AddColumnProps {
  onAdd: (name: string) => void;
  isPending: boolean;
}

export function AddColumn({ onAdd, isPending }: AddColumnProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName('');
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="h-fit w-72 shrink-0 rounded-column border border-dashed border-border bg-surface/60 px-3 py-3 text-sm font-medium text-text-muted transition-colors hover:border-primary hover:text-primary"
      >
        + Add column
      </button>
    );
  }

  return (
    <div className="flex w-72 shrink-0 flex-col gap-2 rounded-column bg-surface p-3 shadow-resting">
      <input
        autoFocus
        aria-label="New column name"
        placeholder="Column name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') {
            setName('');
            setIsOpen(false);
          }
        }}
        className="rounded-card border border-border bg-surface px-2 py-1.5 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !name.trim()}
          className="rounded-card bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Adding…' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => {
            setName('');
            setIsOpen(false);
          }}
          className="rounded-card border border-border px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-bg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
