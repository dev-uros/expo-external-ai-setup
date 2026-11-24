import { readDeviceInfo } from '@/lib/device';
import { request } from '@/lib/http';
import {
  registerWithAppleToken,
  registerWithCode,
  requestSignInCode,
  signInWithAppleToken,
  signInWithCode,
} from '@/features/auth/api/auth';
import { makeUser } from '@/features/shared/testing/fixtures';

jest.mock('@/lib/http', () => ({ ...jest.requireActual('@/lib/http'), request: jest.fn() }));
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
const signedIn = { message: 'Uspešno ste prijavljeni.', data: { token: 't', user: makeUser() } };
const handset = {
  device_id: 'test-device-id',
  platform: 'ios',
  name: 'iPhone 17 Pro',
  operating_system: 'iOS',
  manufacturer: 'Apple',
  os_version: '27.2',
};
const profile = {
  username: 'ana',
  first_name: 'Ana',
  last_name: null,
  display_personal_name: true,
};

beforeEach(() => {
  requestMock.mockReset();
  mockOpened.length = 0;
});

test('asking for a code says whether the address has an account and how long to wait', async () => {
  requestMock.mockResolvedValueOnce({
    message: 'Poslali smo kod.',
    data: { account_exists: true, retry_after: 30 },
  });

  const { data } = await requestSignInCode('ana@example.com');

  expect(requestMock).toHaveBeenCalledWith('/mobile/v1/auth/email/sign-in-code', {
    method: 'POST',
    body: { email: 'ana@example.com' },
  });
  expect(data).toEqual({ account_exists: true, retry_after: 30 });
});

test('signing in with a code describes the phone for the new session', async () => {
  requestMock.mockResolvedValueOnce(signedIn);

  await signInWithCode('ana@example.com', '123456');

  expect(requestMock).toHaveBeenCalledWith('/mobile/v1/auth/email/sign-in', {
    method: 'POST',
    body: { email: 'ana@example.com', code: '123456', device: handset },
  });
});

test('a phone that cannot be read does not block signing in', async () => {
  jest.mocked(readDeviceInfo).mockRejectedValueOnce(new Error('native module missing'));
  requestMock.mockResolvedValueOnce(signedIn);

  await signInWithCode('ana@example.com', '123456');

  expect(requestMock).toHaveBeenCalledWith('/mobile/v1/auth/email/sign-in', {
    method: 'POST',
    body: { email: 'ana@example.com', code: '123456' },
  });
});

test('registering is multipart, with the profile, the phone and the picture', async () => {
  requestMock.mockResolvedValueOnce(signedIn);

  await registerWithCode('ana@example.com', '123456', profile, {
    uri: 'file:///cache/me.jpg',
    width: 200,
    height: 200,
  });

  const [path, options] = requestMock.mock.calls[0]!;
  const body = options?.body as FormData;
  expect(path).toBe('/mobile/v1/auth/email/register');
  expect(body.get('email')).toBe('ana@example.com');
  expect(body.get('code')).toBe('123456');
  expect(body.get('username')).toBe('ana');
  expect(body.get('first_name')).toBe('Ana');
  expect(body.get('last_name')).toBeNull();
  expect(body.get('display_personal_name')).toBe('1');
  expect(body.get('device[device_id]')).toBe('test-device-id');
  expect(body.get('avatar')).toBeInstanceOf(Blob);
  expect(mockOpened).toEqual(['file:///cache/me.jpg']);
});

test('Apple sends the raw nonce and the authorization code, when there is one', async () => {
  requestMock.mockResolvedValue(signedIn);

  await signInWithAppleToken({ idToken: 'jwt', nonce: 'raw', authorizationCode: null });
  expect(requestMock).toHaveBeenLastCalledWith('/mobile/v1/auth/apple/sign-in', {
    method: 'POST',
    body: { id_token: 'jwt', nonce: 'raw', device: handset },
  });

  await registerWithAppleToken(
    { idToken: 'jwt', nonce: 'raw', authorizationCode: 'code' },
    profile,
    null
  );
  const body = requestMock.mock.lastCall?.[1]?.body as FormData;
  expect(body.get('authorization_code')).toBe('code');
  expect(body.get('nonce')).toBe('raw');
  expect(body.get('avatar')).toBeNull();
});
