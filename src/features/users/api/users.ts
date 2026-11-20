import * as z from 'zod';

import { request } from '@/lib/http';
import { apiResponseSchema } from '@/features/shared/schemas/api';
import { userSchema } from '@/features/shared/schemas/user';

/**
 * Reading accounts. Any signed-in user may list and open them; changing them is the web's job.
 */

/**
 * `GET /users` — every account in one response, sorted by name then surname. The endpoint is
 * not paginated, so searching happens on the device.
 */
export async function fetchUsers() {
  const response = await request('/users');
  return apiResponseSchema(z.array(userSchema)).parse(response);
}

/** `GET /users/{id}` — one account; a 404 when it does not exist. */
export async function fetchUser(id: number) {
  const response = await request(`/users/${id}`);
  return apiResponseSchema(userSchema).parse(response);
}
