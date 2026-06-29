/**
 * Create/edit card modal.
 *
 * Drives both flows: pass an existing card to edit it, or omit it to create a
 * new one in the given column. Collects title (required), description,
 * priority, and due date; validates the title before submitting.
 */
import { useEffect, useRef, useState } from 'react';

import type { Card, Priority } from '../lib/boardApi';

export interface CardModalSubmit {
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: string | null;
}

interface CardModalProps {
  open: boolean;
  /** The card being edited, or null when creating. */
  card: Card | null;
  isPending: boolean;
  onSubmit: (values: CardModalSubmit) => void;
  onClose: () => void;
}

/** ISO timestamp → `yyyy-mm-dd` for the date input (empty when unset). */
function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

/** `yyyy-mm-dd` → ISO timestamp at UTC midnight (null when empty). */
function fromDateInputValue(value: string): string | null {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];

export function CardModal({ open, card, isPending, onSubmit, onClose }: CardModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Sync form state to the card whenever the modal opens.
  useEffect(() => {
    if (open) {
      setTitle(card?.title ?? '');
      setDescription(card?.description ?? '');
      setPriority(card?.priority ?? 'MEDIUM');
      setDueDate(toDateInputValue(card?.dueDate ?? null));
      setTitleError(null);
      // Focus the title field on open.
      requestAnimationFrame(() => titleRef.current?.focus());
    }
  }, [open, card]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError('Title is required');
      return;
    }
    onSubmit({
      title: trimmed,
      description: description.trim() ? description.trim() : null,
      priority,
      dueDate: fromDateInputValue(dueDate),
    });
  }

  const isEditing = card !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-text/40 p-4"
      onClick={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-modal-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-4 rounded-column bg-surface p-6 shadow-lifted"
      >
        <h2 id="card-modal-title" className="text-lg font-semibold text-text">
          {isEditing ? 'Edit card' : 'New card'}
        </h2>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="card-title" className="text-sm font-medium text-text">
            Title
          </label>
          <input
            ref={titleRef}
            id="card-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? 'card-title-error' : undefined}
            className={`rounded-card border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/40 ${
              titleError ? 'border-priority-high' : 'border-border'
            }`}
          />
          {titleError ? (
            <p id="card-title-error" role="alert" className="text-xs text-priority-high">
              {titleError}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="card-description" className="text-sm font-medium text-text">
            Description
          </label>
          <textarea
            id="card-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="resize-none rounded-card border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="card-priority" className="text-sm font-medium text-text">
              Priority
            </label>
            <select
              id="card-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="rounded-card border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="card-due" className="text-sm font-medium text-text">
              Due date
            </label>
            <input
              id="card-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-card border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
            />
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-card border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-bg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-card bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Add card'}
          </button>
        </div>
      </form>
    </div>
  );
}
