import { request } from '@/lib/http';
import { apiResponseSchema, messageOnlySchema } from '@/features/shared/schemas/api';
import { userSchema } from '@/features/shared/schemas/user';

/** `GET /mobile/v1/me` — the account behind the stored token, read fresh. 401 = the token is dead. */
export async function me() {
  const body = await request('/mobile/v1/me');
  return apiResponseSchema(userSchema).parse(body);
}

/** `POST /mobile/v1/auth/logout` — revokes this phone's token and clears its push token. */
export async function logout() {
  const body = await request('/mobile/v1/auth/logout', { method: 'POST' });
  return messageOnlySchema.parse(body);
}
