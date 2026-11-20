import { request } from '@/lib/http';
import { apiResponseSchema, messageOnlySchema } from '@/features/shared/schemas/api';
import { authenticatedUserSchema, userSchema } from '@/features/shared/schemas/user';
import type { Credentials } from '@/features/auth/schemas/credentials';

/**
 * Sign-in, sign-out and session restore. Each returns the parsed envelope, because `message`
 * is part of the answer.
 */

/** `POST /auth/login` — 401 when the pair is wrong, 403 when the account is switched off. */
export async function login(credentials: Credentials) {
  const body = await request('/auth/login', { method: 'POST', body: credentials });
  return apiResponseSchema(authenticatedUserSchema).parse(body);
}

/** `GET /auth/me` — the account behind the stored token, read fresh. 401 = the token is dead. */
export async function me() {
  const body = await request('/auth/me');
  return apiResponseSchema(userSchema).parse(body);
}

/** `POST /auth/logout` — revokes only this device's token; other devices stay signed in. */
export async function logout() {
  const body = await request('/auth/logout', { method: 'POST' });
  return messageOnlySchema.parse(body);
}
