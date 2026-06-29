/**
 * Column mutation hooks (create / rename / delete).
 *
 * Each mutation invalidates the board query on success so the view reflects the
 * persisted server state (no duplicated local state — AGENTS.md §5.3).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createColumn, deleteColumn, updateColumn } from '../lib/boardApi';
import { BOARD_QUERY_KEY } from './useBoard';

export function useColumnMutations() {
  const queryClient = useQueryClient();
  const invalidateBoard = () => queryClient.invalidateQueries({ queryKey: BOARD_QUERY_KEY });

  const create = useMutation({
    mutationFn: (name: string) => createColumn(name),
    onSuccess: invalidateBoard,
  });

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateColumn(id, { name }),
    onSuccess: invalidateBoard,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteColumn(id),
    onSuccess: invalidateBoard,
  });

  return { create, rename, remove };
}
