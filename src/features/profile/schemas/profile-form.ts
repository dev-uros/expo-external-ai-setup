import * as z from 'zod';

/**
 * Editing one's own account, mirroring the backend's `UpdateUserRequest`:
 * `name` / `surname`: required|string|max:255, `email`: required|string|email|max:255|unique.
 * Uniqueness can only be checked by the server — it answers 422 on `email`.
 *
 * The endpoint is a `PUT`: every field is sent, changed or not. Values are trimmed first, as
 * Laravel trims them too, so "  " fails here the way it would fail there.
 */
const MAX = 255;
const TOO_LONG = `Najviše ${MAX} karaktera`;

export const profileFormSchema = z.object({
  name: z.string().trim().min(1, 'Unesite ime').max(MAX, TOO_LONG),
  surname: z.string().trim().min(1, 'Unesite prezime').max(MAX, TOO_LONG),
  email: z.string().trim().pipe(z.email('Unesite ispravnu email adresu').max(MAX, TOO_LONG)),
});

export type ProfileForm = z.infer<typeof profileFormSchema>;

/** The fields this form renders — see `toFormFeedback`. */
export const PROFILE_FIELDS = ['name', 'surname', 'email'] as const;

export type ProfileField = (typeof PROFILE_FIELDS)[number];
