/** Card controllers: validate input, enforce auth, call the service. */
import { type RequestHandler } from 'express';

import { UnauthorizedError } from '../../lib/errors.js';
import { createCardSchema, updateCardSchema } from './card.schemas.js';
import { createCard, updateCard, deleteCard } from './card.service.js';

function requireUserId(req: { userId?: string }): string {
  if (!req.userId) {
    throw new UnauthorizedError();
  }
  return req.userId;
}

/** Express 5 types route params as `string | string[]`; collapse to a string. */
function paramId(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : (value ?? '');
}

/** POST /api/cards — create a card in one of the user's columns. */
export const postCard: RequestHandler = async (req, res) => {
  const userId = requireUserId(req);
  const input = createCardSchema.parse(req.body);
  const card = await createCard(userId, input);
  res.status(201).json({ card });
};

/** PATCH /api/cards/:id — edit a card's fields. */
export const patchCard: RequestHandler = async (req, res) => {
  const userId = requireUserId(req);
  const input = updateCardSchema.parse(req.body);
  const card = await updateCard(userId, paramId(req.params.id), input);
  res.status(200).json({ card });
};

/** DELETE /api/cards/:id — delete a card. */
export const removeCard: RequestHandler = async (req, res) => {
  const userId = requireUserId(req);
  await deleteCard(userId, paramId(req.params.id));
  res.status(204).send();
};
