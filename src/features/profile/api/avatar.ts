import { File } from 'expo-file-system';

import { request } from '@/lib/http';
import type { AvatarAsset } from '@/features/profile/schemas/avatar';
import { apiResponseSchema } from '@/features/shared/schemas/api';
import { userSchema } from '@/features/shared/schemas/user';

/**
 * Setting and removing one's own profile picture — the one write a plain user may make, and
 * only on their own account (somebody else's is a 403).
 */

/**
 * `POST /users/{id}/avatar` — `multipart/form-data`, field `avatar`. The picked file is sent as
 * it is: the backend crops it to a square 512x512 WebP under a fresh random name, so the
 * returned `avatar_url` is the only correct one and the old file is already gone.
 */
export async function uploadAvatar(id: number, asset: AvatarAsset) {
  const body = new FormData();
  // expo-file-system's File is a Blob that expo/fetch streams from disk.
  body.append('avatar', new File(asset.uri) as unknown as Blob);

  const response = await request(`/users/${id}/avatar`, { method: 'POST', body });
  return apiResponseSchema(userSchema).parse(response);
}

/** `DELETE /users/{id}/avatar` — removing one from an account that has none is also a 200. */
export async function removeAvatar(id: number) {
  const response = await request(`/users/${id}/avatar`, { method: 'DELETE' });
  return apiResponseSchema(userSchema).parse(response);
}
