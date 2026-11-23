import { readDeviceInfo } from '@/lib/device';
import { request } from '@/lib/http';
import { login } from '@/features/auth/api/session';

jest.mock('@/lib/http', () => ({ ...jest.requireActual('@/lib/http'), request: jest.fn() }));

const requestMock = request as jest.MockedFunction<typeof request>;
const credentials = { email: 'uros.minic@fifthguild.com', password: 'password' };

beforeEach(() => {
  requestMock.mockReset();
  requestMock.mockResolvedValue({
    message: 'Uspešno ste prijavljeni.',
    data: {
      token: 'plain-token',
      user: {
        id: 1,
        name: 'Uroš',
        surname: 'Minić',
        email: 'uros.minic@fifthguild.com',
        role: 'admin',
        avatar_url: null,
        deactivated_at: null,
        email_verified_at: '2026-08-19T13:42:29+00:00',
        created_at: '2026-08-19T13:42:29+00:00',
        updated_at: '2026-08-19T13:42:29+00:00',
      },
    },
  });
});

test('a sign-in describes the phone, so the backend records it against the new session', async () => {
  await login(credentials);

  expect(requestMock).toHaveBeenCalledWith('/auth/login', {
    method: 'POST',
    body: {
      ...credentials,
      device: {
        device_id: 'test-device-id',
        platform: 'ios',
        name: 'iPhone 17 Pro',
        operating_system: 'iOS',
        manufacturer: 'Apple',
        os_version: '27.2',
      },
    },
  });
});

test('a phone that cannot be read does not block the sign-in', async () => {
  jest.mocked(readDeviceInfo).mockRejectedValueOnce(new Error('native module missing'));

  await login(credentials);

  expect(requestMock).toHaveBeenCalledWith('/auth/login', { method: 'POST', body: credentials });
});
