import * as z from 'zod';

/**
 * The signed-in account, exactly as `GET /mobile/v1/me` returns it. Field names are the
 * backend's (snake_case), kept as-is all the way into the UI so a 422 lands on its field.
 *
 * An account of the external app: a username, optionally a first and last name and whether to
 * show them, a picture. No role — every account may do the same things.
 */

/** Timestamps arrive as ISO 8601 with an offset (`2026-08-19T13:42:29+00:00`). */
const timestamp = z.iso.datetime({ offset: true });

export const localeSchema = z.enum(['sr', 'en']);

export const userSchema = z.object({
  id: z.number().int(),
  username: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  /** Show "first last" instead of the username, where a name was given. */
  display_personal_name: z.boolean(),
  /** What to greet the person with — decided by the server from the two fields above. */
  display_name: z.string(),
  email: z.string(),
  /** Absolute URL of the profile picture, or `null` — then the UI draws an initial. */
  avatar_url: z.url().nullable(),
  /** The language mail and pushes are written in. */
  locale: localeSchema,
  has_google: z.boolean(),
  /** Deleting an Apple-linked account asks Apple for a fresh code first. */
  has_apple: z.boolean(),
  created_at: timestamp,
});

export type User = z.infer<typeof userSchema>;

/** What every sign-in and registration hands back. */
export const authenticatedUserSchema = z.object({
  user: userSchema,
  token: z.string().min(1),
});

export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;
