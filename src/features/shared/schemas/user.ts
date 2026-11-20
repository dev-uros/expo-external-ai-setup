import * as z from 'zod';

/**
 * A user account, exactly as the API returns it. Field names are the backend's
 * (`name`/`surname`, snake_case timestamps), kept as-is all the way into the UI.
 */

/** `admin` may do everything the API offers, `user` may only read. The API enforces it. */
export const userRoleSchema = z.enum(['admin', 'user']);

export type UserRole = z.infer<typeof userRoleSchema>;

/** Timestamps arrive as ISO 8601 with an offset (`2026-08-19T13:42:29+00:00`). */
const timestamp = z.iso.datetime({ offset: true });

export const userSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  surname: z.string(),
  email: z.email(),
  role: userRoleSchema,
  /** Absolute URL of the profile picture, or `null` — then the UI draws initials. */
  avatar_url: z.url().nullable(),
  /** `null` means the account works; a date means it has been switched off. */
  deactivated_at: timestamp.nullable(),
  /** `null` means the account was never activated. */
  email_verified_at: timestamp.nullable(),
  created_at: timestamp,
  updated_at: timestamp,
});

export type User = z.infer<typeof userSchema>;

/** What `POST /auth/login` hands back. */
export const authenticatedUserSchema = z.object({
  user: userSchema,
  token: z.string().min(1),
});

export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;
