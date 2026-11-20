import * as z from 'zod';

/** `/users/[id]` — a positive whole number, or the link is not a user. */
export const userIdParamSchema = z.coerce.number().int().positive();

/** The id from the route, or `null` when it is missing or not an id. */
export function parseUserId(raw: unknown): number | null {
  const result = userIdParamSchema.safeParse(raw);
  return result.success ? result.data : null;
}
