import * as z from 'zod';

import { userRoleSchema } from '@/features/shared/schemas/user';

/**
 * The write forms, mirroring the backend's `StoreUserRequest` / `UpdateUserRequest`:
 * `name` / `surname`: required|string|max:255, `email`: required|string|email|max:255|unique.
 * Uniqueness only the server can check — it answers 422 on `email`. Field names are the API's,
 * so a 422 lands on the field it names. Values are trimmed first, as Laravel trims them.
 */
const MAX = 255;
const TOO_LONG = `Najviše ${MAX} karaktera`;

/**
 * Editing is a `PUT`: every field is sent, changed or not. `role` is absent on purpose — it has
 * its own endpoint, so an edit can never hand out privileges by accident.
 */
export const updateUserSchema = z.object({
  name: z.string().trim().min(1, 'Unesite ime').max(MAX, TOO_LONG),
  surname: z.string().trim().min(1, 'Unesite prezime').max(MAX, TOO_LONG),
  email: z.string().trim().pipe(z.email('Unesite ispravnu email adresu').max(MAX, TOO_LONG)),
});

export type UpdateUserForm = z.infer<typeof updateUserSchema>;

/**
 * Creating takes no password: the backend generates one nobody sees and emails an activation
 * link. Sending a `password` would not just be unnecessary — the endpoint rejects the field.
 */
export const createUserSchema = updateUserSchema.extend({ role: userRoleSchema });

export type CreateUserForm = z.infer<typeof createUserSchema>;

/** The fields the form renders — see `toFormFeedback`. */
export const USER_FORM_FIELDS = ['name', 'surname', 'email', 'role'] as const;

export type UserFormField = (typeof USER_FORM_FIELDS)[number];
