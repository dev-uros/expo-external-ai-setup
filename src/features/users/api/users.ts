import * as z from 'zod';

import { request } from '@/lib/http';
import { apiResponseSchema, messageOnlySchema } from '@/features/shared/schemas/api';
import { userRoleSchema, userSchema, type UserRole } from '@/features/shared/schemas/user';
import type { CreateUserForm, UpdateUserForm } from '@/features/users/schemas/user-form';

/**
 * Accounts. Any signed-in user may list and open them; every write is admin-only and answers
 * 403 otherwise — the app hides those actions from a plain user, but the API decides. Each write
 * returns the updated account and a `message` for the user, shown as it arrives.
 */

const userResponse = apiResponseSchema(userSchema);

/**
 * `GET /users` — every account in one response, sorted by name then surname. The endpoint is
 * not paginated, so searching happens on the device.
 */
export async function fetchUsers() {
  return apiResponseSchema(z.array(userSchema)).parse(await request('/users'));
}

/** `GET /users/{id}` — one account; a 404 when it does not exist. */
export async function fetchUser(id: number) {
  return userResponse.parse(await request(`/users/${id}`));
}

/** `POST /users` — 201 with the new, not yet activated account; the invite goes out by email. */
export async function createUser(form: CreateUserForm) {
  return userResponse.parse(await request('/users', { method: 'POST', body: form }));
}

/** `PUT /users/{id}` — name, surname and email; 422 on a taken email. */
export async function updateUser(id: number, form: UpdateUserForm) {
  return userResponse.parse(await request(`/users/${id}`, { method: 'PUT', body: form }));
}

/** `PUT /users/{id}/role` — never one's own (403). */
export async function changeUserRole(id: number, role: UserRole) {
  const body = { role: userRoleSchema.parse(role) };
  return userResponse.parse(await request(`/users/${id}/role`, { method: 'PUT', body }));
}

/** `POST /users/{id}/deactivate` — signs the user out everywhere; never one's own account. */
export async function deactivateUser(id: number) {
  return userResponse.parse(await request(`/users/${id}/deactivate`, { method: 'POST' }));
}

/** `POST /users/{id}/reactivate` */
export async function reactivateUser(id: number) {
  return userResponse.parse(await request(`/users/${id}/reactivate`, { method: 'POST' }));
}

/** `POST /users/{id}/resend-activation` — a fresh link; only the message comes back. */
export async function resendActivation(id: number) {
  return messageOnlySchema.parse(
    await request(`/users/${id}/resend-activation`, { method: 'POST' })
  );
}
