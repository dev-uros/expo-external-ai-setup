import * as z from 'zod';

/**
 * What may be sent to `POST /users/{id}/avatar`, mirroring the backend's
 * `UpdateUserAvatarRequest`: JPEG, PNG, WebP or GIF, at least 64x64, at most 5 MB.
 *
 * The backend checks all of it again and answers 422 with its own message. This schema exists
 * so a picture the server would refuse is never uploaded over a mobile connection; the wording
 * is ours because the request that would have produced an API message is never made — the same
 * Serbian as the web.
 */
export const AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_MIN_SIZE = 64;

/** 0 means the system did not say; only a known size below the minimum is refused here. */
const dimension = z.number().refine((value) => value === 0 || value >= AVATAR_MIN_SIZE, {
  error: 'Slika mora biti najmanje 64x64 piksela.',
});

export const avatarAssetSchema = z.object({
  uri: z.string().min(1),
  /** Unknown on some Android providers; then the server decides. */
  mimeType: z.enum(AVATAR_MIME_TYPES, { error: 'Dozvoljeni su JPEG, PNG, WebP i GIF.' }).optional(),
  /** Unknown on some Android providers; the server still checks it. */
  fileSize: z
    .number()
    .max(AVATAR_MAX_BYTES, { error: 'Slika ne sme biti veća od 5 MB.' })
    .optional(),
  width: dimension,
  height: dimension,
});

export type AvatarAsset = z.infer<typeof avatarAssetSchema>;
