/** Column controllers: validate input, enforce auth, call the service. */
import { type RequestHandler } from 'express';

import { UnauthorizedError } from '../../lib/errors.js';
import { createColumnSchema, updateColumnSchema } from './column.schemas.js';
import { createColumn, updateColumn, deleteColumn } from './column.service.js';

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

/** POST /api/columns — create a column on the user's board. */
export const postColumn: RequestHandler = async (req, res) => {
  const userId = requireUserId(req);
  const input = createColumnSchema.parse(req.body);
  const column = await createColumn(userId, input);
  res.status(201).json({ column });
};

/** PATCH /api/columns/:id — rename and/or reorder a column. */
export const patchColumn: RequestHandler = async (req, res) => {
  const userId = requireUserId(req);
  const input = updateColumnSchema.parse(req.body);
  const column = await updateColumn(userId, paramId(req.params.id), input);
  res.status(200).json({ column });
};

/** DELETE /api/columns/:id — delete a column (and its cards). */
export const removeColumn: RequestHandler = async (req, res) => {
  const userId = requireUserId(req);
  await deleteColumn(userId, paramId(req.params.id));
  res.status(204).send();
};
