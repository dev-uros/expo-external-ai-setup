import { request } from '@/lib/http';
import { removeAvatar, uploadAvatar } from '@/features/shared/api/avatar';
import { makeUser } from '@/features/shared/testing/fixtures';

jest.mock('@/lib/http', () => ({ ...jest.requireActual('@/lib/http'), request: jest.fn() }));
// The real File is a native Blob that streams the picture from disk; here it is a plain Blob
// that remembers which file it was opened on.
const mockOpened: string[] = [];
jest.mock('expo-file-system', () => ({
  File: class extends Blob {
    constructor(uri: string) {
      super(['jpeg bytes'], { type: 'image/jpeg' });
      mockOpened.push(uri);
    }
  },
}));

const requestMock = request as jest.MockedFunction<typeof request>;
const user = makeUser({ avatar_url: 'http://api.test/storage/mobile-users/avatars/x.webp' });

beforeEach(() => {
  requestMock.mockReset();
  mockOpened.length = 0;
});

test('uploads the picked file as multipart field `avatar` to the own account', async () => {
  requestMock.mockResolvedValueOnce({ message: 'Profilna slika je sačuvana.', data: user });

  const result = await uploadAvatar({
    uri: 'file:///cache/cropped.jpg',
    mimeType: 'image/jpeg',
    width: 512,
    height: 512,
  });

  const [path, options] = requestMock.mock.calls[0]!;
  expect(path).toBe('/mobile/v1/me/avatar');
  expect(options?.method).toBe('POST');
  const body = options?.body as FormData;
  expect(body).toBeInstanceOf(FormData);
  expect(body.get('avatar')).toBeInstanceOf(Blob);
  expect(mockOpened).toEqual(['file:///cache/cropped.jpg']);
  expect(result.data.avatar_url).toBe(user.avatar_url);
});

test('removal is a DELETE and returns the account without a picture', async () => {
  requestMock.mockResolvedValueOnce({
    message: 'Profilna slika je uklonjena.',
    data: { ...user, avatar_url: null },
  });

  const result = await removeAvatar();

  expect(requestMock).toHaveBeenCalledWith('/mobile/v1/me/avatar', { method: 'DELETE' });
  expect(result.data.avatar_url).toBeNull();
});
