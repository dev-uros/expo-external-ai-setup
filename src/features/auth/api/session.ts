import { request } from '@/lib/http';
import { devicePayload } from '@/features/shared/api/device';
import { apiResponseSchema, messageOnlySchema } from '@/features/shared/schemas/api';
import { authenticatedUserSchema, userSchema } from '@/features/shared/schemas/user';
import type { Credentials } from '@/features/auth/schemas/credentials';

/**
 * Sign-in, sign-out and session restore. Each returns the parsed envelope, because `message`
 * is part of the answer.
 */

/**
 * `POST /auth/login` — 401 when the pair is wrong, 403 when the account is switched off.
 *
 * Carries the phone too, so the backend records it against the session it hands back. Reading
 * the handset cannot block a sign-in: without it the login goes ahead, and the next launch
 * registers the phone through `PUT /auth/device`.
 */
export async function login(credentials: Credentials) {
  const device = await devicePayload().catch(() => undefined);
  const body = await request('/auth/login', {
    method: 'POST',
    body: device === undefined ? credentials : { ...credentials, device },
  });
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
