import * as z from 'zod';

/**
 * The sign-in form, mirroring the backend's `LoginRequest` (`email: required|string|email`,
 * `password: required|string`). No password policy on purpose: this field carries an existing
 * password, and rejecting it locally would lock out accounts created under older rules. The API
 * answers 401 when the pair is wrong.
 */
export const credentialsSchema = z.object({
  email: z.email('Unesite ispravnu email adresu'),
  password: z.string().min(1, 'Unesite lozinku'),
});

export type Credentials = z.infer<typeof credentialsSchema>;

/** The fields this form renders — see `toFormFeedback`. */
export const CREDENTIALS_FIELDS = ['email', 'password'] as const;

export type CredentialsField = (typeof CREDENTIALS_FIELDS)[number];
