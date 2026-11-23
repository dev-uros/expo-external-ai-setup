import {
  pushConfigured,
  readExpoPushToken,
  readPushPermission,
  requestPushPermission,
} from '@/lib/notifications';
import { readJson } from '@/lib/storage';
import { registerDevice } from '@/features/shared/api/device';
import { shouldAskAutomatically, syncPushRegistration } from '@/features/notifications/sync';
import { makeDevice } from '@/features/notifications/testing/fixtures';
import Storage from 'expo-sqlite/kv-store';

jest.mock('@/features/shared/api/device', () => ({ registerDevice: jest.fn() }));

const register = jest.mocked(registerDevice);
const device = makeDevice();
const allowed = { granted: true, canAskAgain: true };
const refused = { granted: false, canAskAgain: false };

beforeEach(() => {
  jest.clearAllMocks();
  Storage.clear();
  register.mockResolvedValue({ message: 'Uređaj je sačuvan.', data: device });
  jest.mocked(pushConfigured).mockReturnValue(true);
});

test('the app asks on its own once per install, then leaves it to the profile', async () => {
  expect(shouldAskAutomatically()).toBe(true);

  await syncPushRegistration({ prompt: true });

  expect(requestPushPermission).toHaveBeenCalled();
  expect(readJson('notifications.asked-after-sign-in')).toBe(true);
  expect(shouldAskAutomatically()).toBe(false);
});

test('without a prompt the permission is only read, and the flag is untouched', async () => {
  await syncPushRegistration({ prompt: false });

  expect(requestPushPermission).not.toHaveBeenCalled();
  expect(readPushPermission).toHaveBeenCalled();
  expect(shouldAskAutomatically()).toBe(true);
});

test('the user is asked even when sending is not configured yet', async () => {
  jest.mocked(pushConfigured).mockReturnValue(false);
  jest.mocked(requestPushPermission).mockResolvedValueOnce(allowed);

  const result = await syncPushRegistration({ prompt: true });

  expect(requestPushPermission).toHaveBeenCalled();
  expect(readExpoPushToken).not.toHaveBeenCalled();
  expect(register).toHaveBeenCalledWith(undefined);
  expect(result).toEqual({ device, permission: allowed });
});

test('a refusal clears the token on the server', async () => {
  jest.mocked(requestPushPermission).mockResolvedValueOnce(refused);

  const result = await syncPushRegistration({ prompt: true });

  expect(register).toHaveBeenCalledWith(null);
  expect(result.permission).toEqual(refused);
});

test('allowed and configured: the current Expo token is stored', async () => {
  jest.mocked(requestPushPermission).mockResolvedValueOnce(allowed);
  jest.mocked(readExpoPushToken).mockResolvedValueOnce('ExponentPushToken[abc]');

  await syncPushRegistration({ prompt: true });

  expect(register).toHaveBeenCalledWith('ExponentPushToken[abc]');
});

test('a token that cannot be read leaves the stored one alone', async () => {
  jest.mocked(requestPushPermission).mockResolvedValueOnce(allowed);
  jest.mocked(readExpoPushToken).mockRejectedValueOnce(new Error('no Firebase'));

  await syncPushRegistration({ prompt: true });

  expect(register).toHaveBeenCalledWith(undefined);
});
