import * as z from 'zod';

/**
 * One remembered destination: where (the path as the router shows it, `/users/7`), how often,
 * and when last. Stored on the device, so it is parsed on the way back in — an entry written by
 * an older version may not have this shape any more.
 */
export const shortcutVisitSchema = z.object({
  path: z.string().startsWith('/'),
  visits: z.number().int().positive(),
  lastVisitedAt: z.iso.datetime(),
});

export type ShortcutVisit = z.infer<typeof shortcutVisitSchema>;

export const shortcutHistorySchema = z.array(shortcutVisitSchema);
