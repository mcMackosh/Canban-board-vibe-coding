/**
 * A single card: white surface with a colored left accent bar indicating
 * priority (AGENTS.md §4.2). Shows title, optional description + due date, and
 * edit/delete actions.
 */
import type { Card, Priority } from '../lib/boardApi';

/** Tailwind background class for each priority's accent bar. */
const PRIORITY_ACCENT: Record<Priority, string> = {
  LOW: 'bg-priority-low',
  MEDIUM: 'bg-priority-medium',
  HIGH: 'bg-priority-high',
};

const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

/** Format an ISO date as a short, locale-friendly due date. */
function formatDueDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface CardItemProps {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (card: Card) => void;
}

export function CardItem({ card, onEdit, onDelete }: CardItemProps) {
  return (
    <article className="group relative flex overflow-hidden rounded-card border border-border bg-surface shadow-resting transition-shadow hover:shadow-lifted">
      <span aria-hidden="true" className={`w-1.5 shrink-0 ${PRIORITY_ACCENT[card.priority]}`} />
      <div className="flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-text">{card.title}</h3>
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            <button
              type="button"
              aria-label={`Edit ${card.title}`}
              onClick={() => onEdit(card)}
              className="rounded-card px-1.5 py-0.5 text-xs text-text-muted transition-colors hover:bg-bg hover:text-text"
            >
              ✏️
            </button>
            <button
              type="button"
              aria-label={`Delete ${card.title}`}
              onClick={() => onDelete(card)}
              className="rounded-card px-1.5 py-0.5 text-xs text-text-muted transition-colors hover:bg-bg hover:text-priority-high"
            >
              🗑️
            </button>
          </div>
        </div>

        {card.description ? (
          <p className="mt-1 line-clamp-3 text-xs text-text-muted">{card.description}</p>
        ) : null}

        <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1">
            <span
              className={`inline-block h-2 w-2 rounded-full ${PRIORITY_ACCENT[card.priority]}`}
              aria-hidden="true"
            />
            {PRIORITY_LABEL[card.priority]}
          </span>
          {card.dueDate ? <span>· Due {formatDueDate(card.dueDate)}</span> : null}
        </div>
      </div>
    </article>
  );
}
