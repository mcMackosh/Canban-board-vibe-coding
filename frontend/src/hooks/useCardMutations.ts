/**
 * Card mutation hooks (create / edit / delete).
 *
 * Edit and delete apply optimistic updates to the cached board for snappy UX,
 * rolling back on error; create relies on invalidation (the server assigns the
 * id + position). Every mutation re-syncs with the server on settle.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createCard,
  deleteCard,
  updateCard,
  type Board,
  type Card,
  type CreateCardInput,
  type UpdateCardInput,
} from '../lib/boardApi';
import { BOARD_QUERY_KEY } from './useBoard';

/**
 * Apply `fn` to every card in the cached board; returning null from `fn` drops
 * that card. Produces a new board (immutable update for the query cache).
 */
function mapBoardCards(board: Board, fn: (card: Card) => Card | null): Board {
  return {
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      cards: column.cards.map(fn).filter((card): card is Card => card !== null),
    })),
  };
}

export function useCardMutations() {
  const queryClient = useQueryClient();
  const invalidateBoard = () => queryClient.invalidateQueries({ queryKey: BOARD_QUERY_KEY });

  const create = useMutation({
    mutationFn: (input: CreateCardInput) => createCard(input),
    onSuccess: invalidateBoard,
  });

  const edit = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCardInput }) => updateCard(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: BOARD_QUERY_KEY });
      const previous = queryClient.getQueryData<Board>(BOARD_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData<Board>(
          BOARD_QUERY_KEY,
          mapBoardCards(previous, (card) => (card.id === id ? { ...card, ...data } : card)),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(BOARD_QUERY_KEY, context.previous);
      }
    },
    onSettled: invalidateBoard,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCard(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: BOARD_QUERY_KEY });
      const previous = queryClient.getQueryData<Board>(BOARD_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData<Board>(
          BOARD_QUERY_KEY,
          mapBoardCards(previous, (card) => (card.id === id ? null : card)),
        );
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(BOARD_QUERY_KEY, context.previous);
      }
    },
    onSettled: invalidateBoard,
  });

  return { create, edit, remove };
}
