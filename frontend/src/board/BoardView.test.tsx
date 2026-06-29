import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as boardApi from '../lib/boardApi';
import type { Board, Column } from '../lib/boardApi';
import { BoardView } from './BoardView';

vi.mock('../lib/boardApi');
const mocked = vi.mocked(boardApi);

function makeColumn(id: string, name: string, position: number): Column {
  return { id, name, position, boardId: 'b1', createdAt: '2026-01-01T00:00:00.000Z' };
}

function makeBoard(columns: Column[]): Board {
  return {
    id: 'b1',
    name: 'My Board',
    userId: 'u1',
    createdAt: '2026-01-01T00:00:00.000Z',
    columns,
  };
}

/** Render BoardView with a fresh QueryClient (no retries/cache bleed). */
function renderBoard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <BoardView />
    </QueryClientProvider>,
  );
}

const STARTER = [
  makeColumn('c1', 'To Do', 0),
  makeColumn('c2', 'In Progress', 1),
  makeColumn('c3', 'Done', 2),
];

describe('BoardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.fetchBoard.mockResolvedValue({ board: makeBoard(STARTER) });
  });

  it('renders the three starter columns from the API', async () => {
    renderBoard();

    expect(await screen.findByRole('heading', { name: 'To Do' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'In Progress' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Done' })).toBeInTheDocument();
  });

  it('creates a column through the add control', async () => {
    const user = userEvent.setup();
    mocked.createColumn.mockResolvedValue({ column: makeColumn('c4', 'Backlog', 3) });
    renderBoard();
    await screen.findByRole('heading', { name: 'To Do' });

    await user.click(screen.getByRole('button', { name: '+ Add column' }));
    await user.type(screen.getByLabelText('New column name'), 'Backlog');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(mocked.createColumn).toHaveBeenCalledWith('Backlog'));
  });

  it('renames a column via the rename button', async () => {
    const user = userEvent.setup();
    mocked.updateColumn.mockResolvedValue({ column: makeColumn('c1', 'Ideas', 0) });
    renderBoard();
    await screen.findByRole('heading', { name: 'To Do' });

    await user.click(screen.getByRole('button', { name: 'Rename To Do' }));
    const input = screen.getByLabelText('Column name');
    await user.clear(input);
    await user.type(input, 'Ideas{Enter}');

    await waitFor(() => expect(mocked.updateColumn).toHaveBeenCalledWith('c1', { name: 'Ideas' }));
  });

  it('deletes a column only after confirmation (FR-8)', async () => {
    const user = userEvent.setup();
    mocked.deleteColumn.mockResolvedValue(undefined);
    renderBoard();
    await screen.findByRole('heading', { name: 'To Do' });

    await user.click(screen.getByRole('button', { name: 'Delete Done' }));

    // A confirm dialog appears; nothing deleted yet.
    const dialog = await screen.findByRole('dialog');
    expect(mocked.deleteColumn).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(mocked.deleteColumn).toHaveBeenCalledWith('c3'));
  });

  it('does not delete when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    renderBoard();
    await screen.findByRole('heading', { name: 'To Do' });

    await user.click(screen.getByRole('button', { name: 'Delete Done' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(mocked.deleteColumn).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
