/** Typed board + column + card API calls (all authenticated). */
import { api } from './api';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Card {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: string | null;
  position: number;
  columnId: string;
  createdAt: string;
}

export interface Column {
  id: string;
  name: string;
  position: number;
  boardId: string;
  createdAt: string;
  cards: Card[];
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

/** Fields accepted when creating a card (title required, rest optional). */
export interface CreateCardInput {
  columnId: string;
  title: string;
  description?: string | null;
  priority?: Priority;
  dueDate?: string | null;
}

/** Fields accepted when editing a card (all optional; null clears nullables). */
export interface UpdateCardInput {
  title?: string;
  description?: string | null;
  priority?: Priority;
  dueDate?: string | null;
}

/** POST /cards — create a card, appended to its column. */
export function createCard(input: CreateCardInput): Promise<{ card: Card }> {
  return api.post<{ card: Card }>('/cards', input, { auth: true });
}

/** PATCH /cards/:id — edit a card's fields. */
export function updateCard(id: string, data: UpdateCardInput): Promise<{ card: Card }> {
  return api.patch<{ card: Card }>(`/cards/${id}`, data, { auth: true });
}

/** DELETE /cards/:id — delete a card. */
export function deleteCard(id: string): Promise<void> {
  return api.delete<void>(`/cards/${id}`, { auth: true });
}
