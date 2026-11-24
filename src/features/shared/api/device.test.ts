import { request } from '@/lib/http';
import { currentDevice, registerDevice, sendTestPush } from '@/features/shared/api/device';
import { makeDevice } from '@/features/notifications/testing/fixtures';

jest.mock('@/lib/http', () => ({ ...jest.requireActual('@/lib/http'), request: jest.fn() }));

const requestMock = request as jest.MockedFunction<typeof request>;
const device = makeDevice();
const handset = {
  device_id: 'test-device-id',
  platform: 'ios',
  name: 'iPhone 17 Pro',
  operating_system: 'iOS',
  manufacturer: 'Apple',
  os_version: '27.2',
};

beforeEach(() => {
  requestMock.mockReset();
  requestMock.mockResolvedValue({ message: 'Uređaj je sačuvan.', data: device });
});

test('registering without a token leaves the stored one alone — the key is not sent', async () => {
  await registerDevice();

  expect(requestMock).toHaveBeenCalledWith('/mobile/v1/device', { method: 'PUT', body: handset });
});

test.each([
  ['switches notifications on', 'ExponentPushToken[abc]'],
  ['switches notifications off', null],
])('registering with a token %s', async (_name, token) => {
  await registerDevice(token);

  expect(requestMock).toHaveBeenCalledWith('/mobile/v1/device', {
    method: 'PUT',
    body: { ...handset, expo_push_notification_token: token },
  });
});

test('the current device is parsed', async () => {
  const result = await currentDevice();

  expect(requestMock).toHaveBeenCalledWith('/mobile/v1/device');
  expect(result.data).toEqual(device);
});

test('a response that is not a device is refused', async () => {
  requestMock.mockResolvedValueOnce({ message: 'OK', data: { id: 'x' } });

  await expect(currentDevice()).rejects.toThrow();
});

test('a test push returns only the message', async () => {
  requestMock.mockResolvedValueOnce({ message: 'Probno obaveštenje je poslato.', data: null });

  const result = await sendTestPush();

  expect(requestMock).toHaveBeenCalledWith('/mobile/v1/device/test-push', { method: 'POST' });
  expect(result.message).toBe('Probno obaveštenje je poslato.');
});
