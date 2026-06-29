/** Typed board + column API calls (all authenticated). */
import { api } from './api';

export interface Column {
  id: string;
  name: string;
  position: number;
  boardId: string;
  createdAt: string;
}

export interface Board {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  columns: Column[];
}

/** GET /board — the user's board with its ordered columns. */
export function fetchBoard(): Promise<{ board: Board }> {
  return api.get<{ board: Board }>('/board', { auth: true });
}

/** POST /columns — append a new column. */
export function createColumn(name: string): Promise<{ column: Column }> {
  return api.post<{ column: Column }>('/columns', { name }, { auth: true });
}

/** PATCH /columns/:id — rename and/or reposition a column. */
export function updateColumn(
  id: string,
  data: { name?: string; position?: number },
): Promise<{ column: Column }> {
  return api.patch<{ column: Column }>(`/columns/${id}`, data, { auth: true });
}

/** DELETE /columns/:id — delete a column and its cards. */
export function deleteColumn(id: string): Promise<void> {
  return api.delete<void>(`/columns/${id}`, { auth: true });
}
