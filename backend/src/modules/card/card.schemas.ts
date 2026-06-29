/** Zod schemas for card request bodies (validation at the edge). */
import { z } from 'zod';

/** Card priority enum (SQLite stores this as a constrained String). */
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const prioritySchema = z.enum(PRIORITIES);

// Optional fields share these rules between create and edit.
const titleSchema = z.string().trim().min(1, 'Title is required').max(200, 'Title is too long');
const descriptionSchema = z.string().trim().max(2000, 'Description is too long');
// Accept an ISO date string (or null to clear); coerce to a Date for Prisma.
const dueDateSchema = z.coerce.date({ message: 'Invalid due date' });

export const createCardSchema = z.object({
  columnId: z.string().min(1, 'columnId is required'),
  title: titleSchema,
  description: descriptionSchema.optional(),
  priority: prioritySchema.optional(),
  dueDate: dueDateSchema.nullable().optional(),
});

// Edit: every field optional, but at least one must be present. `null` clears
// the nullable fields (description, dueDate).
export const updateCardSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema.nullable(),
    priority: prioritySchema,
    dueDate: dueDateSchema.nullable(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
