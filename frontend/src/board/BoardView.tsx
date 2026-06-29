/**
 * Board view: loads the board and renders its columns as a horizontal row,
 * with column management (add / rename / delete) and card management
 * (create / edit / delete) wired to mutations.
 */
import { useState } from 'react';

import { ConfirmDialog } from '../components/ConfirmDialog';
import { useBoard } from '../hooks/useBoard';
import { useCardMutations } from '../hooks/useCardMutations';
import { useColumnMutations } from '../hooks/useColumnMutations';
import type { Card, Column } from '../lib/boardApi';
import { AddColumn } from './AddColumn';
import { BoardColumn } from './BoardColumn';
import { CardModal, type CardModalSubmit } from './CardModal';

/** Open state for the card modal: creating in a column, or editing a card. */
type CardEditorState = { mode: 'create'; columnId: string } | { mode: 'edit'; card: Card } | null;

export function BoardView() {
  const { data: board, isLoading, isError, error } = useBoard();
  const columnMutations = useColumnMutations();
  const cardMutations = useCardMutations();

  const [pendingColumnDelete, setPendingColumnDelete] = useState<Column | null>(null);
  const [cardEditor, setCardEditor] = useState<CardEditorState>(null);
  const [pendingCardDelete, setPendingCardDelete] = useState<Card | null>(null);

  if (isLoading) {
    return <p className="text-sm text-text-muted">Loading board…</p>;
  }

  if (isError || !board) {
    return (
      <p role="alert" className="text-sm text-priority-high">
        {error instanceof Error ? error.message : 'Failed to load the board.'}
      </p>
    );
  }

  function confirmColumnDelete() {
    if (pendingColumnDelete) {
      columnMutations.remove.mutate(pendingColumnDelete.id);
      setPendingColumnDelete(null);
    }
  }

  function confirmCardDelete() {
    if (pendingCardDelete) {
      cardMutations.remove.mutate(pendingCardDelete.id);
      setPendingCardDelete(null);
    }
  }

  function submitCard(values: CardModalSubmit) {
    if (!cardEditor) return;
    if (cardEditor.mode === 'create') {
      cardMutations.create.mutate(
        { columnId: cardEditor.columnId, ...values },
        { onSuccess: () => setCardEditor(null) },
      );
    } else {
      cardMutations.edit.mutate(
        { id: cardEditor.card.id, data: values },
        { onSuccess: () => setCardEditor(null) },
      );
    }
  }

  return (
    <>
      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        {board.columns.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            onRename={(id, name) => columnMutations.rename.mutate({ id, name })}
            onRequestDelete={setPendingColumnDelete}
            onAddCard={(col) => setCardEditor({ mode: 'create', columnId: col.id })}
            onEditCard={(card) => setCardEditor({ mode: 'edit', card })}
            onDeleteCard={setPendingCardDelete}
          />
        ))}
        <AddColumn
          onAdd={(name) => columnMutations.create.mutate(name)}
          isPending={columnMutations.create.isPending}
        />
      </div>

      <CardModal
        open={cardEditor !== null}
        card={cardEditor?.mode === 'edit' ? cardEditor.card : null}
        isPending={cardMutations.create.isPending || cardMutations.edit.isPending}
        onSubmit={submitCard}
        onClose={() => setCardEditor(null)}
      />

      <ConfirmDialog
        open={pendingColumnDelete !== null}
        title="Delete column?"
        message={
          pendingColumnDelete
            ? `"${pendingColumnDelete.name}" and all of its cards will be permanently deleted.`
            : ''
        }
        onConfirm={confirmColumnDelete}
        onCancel={() => setPendingColumnDelete(null)}
      />

      <ConfirmDialog
        open={pendingCardDelete !== null}
        title="Delete card?"
        message={
          pendingCardDelete ? `"${pendingCardDelete.title}" will be permanently deleted.` : ''
        }
        onConfirm={confirmCardDelete}
        onCancel={() => setPendingCardDelete(null)}
      />
    </>
  );
}
