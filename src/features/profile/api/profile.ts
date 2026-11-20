import { request } from '@/lib/http';
import type { ProfileForm } from '@/features/profile/schemas/profile-form';
import { apiResponseSchema } from '@/features/shared/schemas/api';
import { userSchema } from '@/features/shared/schemas/user';

/**
 * `PUT /users/{id}` with the signed-in user's own id.
 *
 * It is the same admin endpoint the web uses for any account: a plain user gets 403, own account
 * included. 422 carries field messages (a taken email among them). The answer is the updated
 * user plus a `message` for the end user.
 */
export async function updateProfile(id: number, form: ProfileForm) {
  const body = await request(`/users/${id}`, { method: 'PUT', body: form });
  return apiResponseSchema(userSchema).parse(body);
}
