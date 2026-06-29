/** Board query hook + shared query key. */
import { useQuery } from '@tanstack/react-query';

import { fetchBoard } from '../lib/boardApi';

export const BOARD_QUERY_KEY = ['board'] as const;

/** Fetch and cache the authenticated user's board. */
export function useBoard() {
  return useQuery({
    queryKey: BOARD_QUERY_KEY,
    queryFn: async () => (await fetchBoard()).board,
  });
}
