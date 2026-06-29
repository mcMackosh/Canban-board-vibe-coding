/**
 * A single board column: header with inline rename + delete, and its cards.
 *
 * Rename is an inline editable title (double-click or the edit button); column
 * delete asks for confirmation via the parent (FR-8). Cards render in order
 * with an add-card control; card actions bubble up to the parent.
 */
import { useState } from 'react';

import type { Card, Column } from '../lib/boardApi';
import { CardItem } from './CardItem';

interface BoardColumnProps {
  column: Column;
  onRename: (id: string, name: string) => void;
  onRequestDelete: (column: Column) => void;
  onAddCard: (column: Column) => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (card: Card) => void;
}

export function BoardColumn({
  column,
  onRename,
  onRequestDelete,
  onAddCard,
  onEditCard,
  onDeleteCard,
}: BoardColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(column.name);

  function commitRename() {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== column.name) {
      onRename(column.id, trimmed);
    } else {
      setDraftName(column.name); // revert empty/unchanged edits
    }
    setIsEditing(false);
  }

  return (
    <section
      aria-label={`Column: ${column.name}`}
      className="flex w-72 shrink-0 flex-col rounded-column bg-surface shadow-resting"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-3">
        {isEditing ? (
          <input
            autoFocus
            aria-label="Column name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') {
                setDraftName(column.name);
                setIsEditing(false);
              }
            }}
            className="w-full rounded-card border border-accent bg-surface px-2 py-1 text-sm font-semibold text-text outline-none focus:ring-2 focus:ring-accent/40"
          />
        ) : (
          <h2
            className="flex-1 cursor-pointer truncate text-sm font-semibold text-text"
            onDoubleClick={() => setIsEditing(true)}
            title={column.name}
          >
            {column.name}
          </h2>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={`Rename ${column.name}`}
            onClick={() => setIsEditing(true)}
            className="rounded-card px-1.5 py-1 text-xs text-text-muted transition-colors hover:bg-bg hover:text-text"
          >
            ✏️
          </button>
          <button
            type="button"
            aria-label={`Delete ${column.name}`}
            onClick={() => onRequestDelete(column)}
            className="rounded-card px-1.5 py-1 text-xs text-text-muted transition-colors hover:bg-bg hover:text-priority-high"
          >
            🗑️
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {column.cards.length === 0 ? (
          <p className="text-xs text-text-muted">No cards yet.</p>
        ) : (
          column.cards.map((card) => (
            <CardItem key={card.id} card={card} onEdit={onEditCard} onDelete={onDeleteCard} />
          ))
        )}

        <button
          type="button"
          onClick={() => onAddCard(column)}
          className="mt-1 rounded-card border border-dashed border-border px-3 py-2 text-xs font-medium text-text-muted transition-colors hover:border-primary hover:text-primary"
        >
          + Add card
        </button>
      </div>
    </section>
  );
}
