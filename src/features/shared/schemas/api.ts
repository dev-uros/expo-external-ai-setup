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

/** The page bookkeeping of Laravel's paginator, as far as the app needs it. */
export const paginationMetaSchema = z.object({
  current_page: z.number().int(),
  last_page: z.number().int(),
  per_page: z.number().int(),
  total: z.number().int(),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/** A page of a paginated endpoint: the envelope plus `meta`. Every one returns 25 rows a page. */
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    message: z.string(),
    data: z.array(item),
    meta: paginationMetaSchema,
  });
}

/** The page after `meta`, or `undefined` on the last one — `getNextPageParam` for infinite lists. */
export function nextPage(meta: PaginationMeta): number | undefined {
  return meta.current_page < meta.last_page ? meta.current_page + 1 : undefined;
}
