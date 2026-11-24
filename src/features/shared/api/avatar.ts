import { File } from 'expo-file-system';

import { request } from '@/lib/http';
import type { AvatarAsset } from '@/features/shared/schemas/avatar';
import { apiResponseSchema } from '@/features/shared/schemas/api';
import { userSchema } from '@/features/shared/schemas/user';

/** The picked file as a multipart part: expo-file-system's File is a Blob expo/fetch streams. */
export function avatarPart(asset: AvatarAsset): Blob {
  return new File(asset.uri) as unknown as Blob;
}

/**
 * `POST /mobile/v1/me/avatar` — `multipart/form-data`, field `avatar`. The backend crops it to a
 * square 512x512 WebP under a fresh random name, so the returned `avatar_url` is the only
 * correct one and the old file is already gone.
 */
export async function uploadAvatar(asset: AvatarAsset) {
  const body = new FormData();
  body.append('avatar', avatarPart(asset));

  const response = await request('/mobile/v1/me/avatar', { method: 'POST', body });
  return apiResponseSchema(userSchema).parse(response);
}

/** `DELETE /mobile/v1/me/avatar` — removing one the account does not have is also a 200. */
export async function removeAvatar() {
  const response = await request('/mobile/v1/me/avatar', { method: 'DELETE' });
  return apiResponseSchema(userSchema).parse(response);
}
