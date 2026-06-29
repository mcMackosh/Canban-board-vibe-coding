/**
 * Board view: loads the board and renders its columns as a horizontal row,
 * with add / rename / delete column management wired to mutations.
 */
import { useState } from 'react';

import { ConfirmDialog } from '../components/ConfirmDialog';
import { useBoard } from '../hooks/useBoard';
import { useColumnMutations } from '../hooks/useColumnMutations';
import type { Column } from '../lib/boardApi';
import { AddColumn } from './AddColumn';
import { BoardColumn } from './BoardColumn';

export function BoardView() {
  const { data: board, isLoading, isError, error } = useBoard();
  const { create, rename, remove } = useColumnMutations();
  const [pendingDelete, setPendingDelete] = useState<Column | null>(null);

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

  function confirmDelete() {
    if (pendingDelete) {
      remove.mutate(pendingDelete.id);
      setPendingDelete(null);
    }
  }

  return (
    <>
      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        {board.columns.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            onRename={(id, name) => rename.mutate({ id, name })}
            onRequestDelete={setPendingDelete}
          />
        ))}
        <AddColumn onAdd={(name) => create.mutate(name)} isPending={create.isPending} />
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete column?"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" and all of its cards will be permanently deleted.`
            : ''
        }
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
