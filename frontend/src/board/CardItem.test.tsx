import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Card } from '../lib/boardApi';
import { CardItem } from './CardItem';

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card1',
    title: 'Write tests',
    description: null,
    priority: 'MEDIUM',
    dueDate: null,
    position: 0,
    columnId: 'c1',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('CardItem', () => {
  it('renders the title, priority label, and description', () => {
    render(
      <CardItem
        card={makeCard({ description: 'cover the edge cases', priority: 'HIGH' })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Write tests' })).toBeInTheDocument();
    expect(screen.getByText('cover the edge cases')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('shows a formatted due date when present', () => {
    render(
      <CardItem
        card={makeCard({ dueDate: '2026-07-01T00:00:00.000Z' })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/Due/)).toBeInTheDocument();
  });

  it('fires edit and delete callbacks', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const card = makeCard();
    render(<CardItem card={card} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Edit Write tests' }));
    expect(onEdit).toHaveBeenCalledWith(card);

    await user.click(screen.getByRole('button', { name: 'Delete Write tests' }));
    expect(onDelete).toHaveBeenCalledWith(card);
  });
});
