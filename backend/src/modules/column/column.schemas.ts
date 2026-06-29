/** Zod schemas for column request bodies (validation at the edge). */
import { z } from 'zod';

export const createColumnSchema = z.object({
  name: z.string().trim().min(1, 'Column name is required').max(60, 'Column name is too long'),
});

// Rename and/or reorder; at least one field must be present.
export const updateColumnSchema = z
  .object({
    name: z.string().trim().min(1, 'Column name is required').max(60, 'Column name is too long'),
    position: z.number().int('Position must be an integer').min(0, 'Position must be non-negative'),
  })
  .partial()
  .refine((data) => data.name !== undefined || data.position !== undefined, {
    message: 'Provide a name or position to update',
  });

export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
