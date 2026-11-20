import * as z from 'zod';

/**
 * The envelope every successful API call shares. `message` is written for the end user, in
 * Serbian — show it verbatim. `data` is always present, `null` when there is nothing to return.
 * Errors do not use this envelope; see `ApiError` in `@/lib/http`.
 */
export function apiResponseSchema<T extends z.ZodType>(data: T) {
  return z.object({
    message: z.string(),
    data,
  });
}

/** An action whose only result is its message (logout). */
export const messageOnlySchema = apiResponseSchema(z.unknown().nullish());
