import * as z from 'zod';

import { AVATAR_MAX_BYTES, avatarAssetSchema } from '@/features/profile/schemas/avatar';

const photo = {
  uri: 'file:///cache/cropped.jpg',
  mimeType: 'image/jpeg',
  fileSize: 400_000,
  width: 1200,
  height: 1200,
};

function errorFor(input: unknown) {
  const result = avatarAssetSchema.safeParse(input);
  return result.success ? null : Object.values(z.flattenError(result.error).fieldErrors)[0]?.[0];
}

test('a normal cropped photo is fine', () => {
  expect(errorFor(photo)).toBeNull();
});

test.each(['image/png', 'image/webp', 'image/gif'])('%s is accepted', (mimeType) => {
  expect(errorFor({ ...photo, mimeType })).toBeNull();
});

test('HEIC and other formats the server refuses are stopped here', () => {
  expect(errorFor({ ...photo, mimeType: 'image/heic' })).toBe(
    'Dozvoljeni su JPEG, PNG, WebP i GIF.'
  );
});

test('over 5 MB is stopped before it is uploaded', () => {
  expect(errorFor({ ...photo, fileSize: AVATAR_MAX_BYTES + 1 })).toBe(
    'Slika ne sme biti veća od 5 MB.'
  );
  expect(errorFor({ ...photo, fileSize: AVATAR_MAX_BYTES })).toBeNull();
});

test('smaller than 64x64 is refused', () => {
  expect(errorFor({ ...photo, width: 63 })).toBe('Slika mora biti najmanje 64x64 piksela.');
});

test('what the system could not tell us is left to the server', () => {
  expect(errorFor({ uri: photo.uri, width: 0, height: 0 })).toBeNull();
});
