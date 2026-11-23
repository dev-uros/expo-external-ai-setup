import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { AppState, Linking, type AppStateStatus } from 'react-native';

import { ApiError } from '@/lib/http';
import { pushConfigured, readPushPermission } from '@/lib/notifications';
import { currentDevice, sendTestPush } from '@/features/shared/api/device';
import { useToastStore } from '@/features/shared/stores/toast';
import {
  describeDevice,
  useNotificationsSection,
} from '@/features/notifications/hooks/use-notifications-section';
import { syncPushRegistration } from '@/features/notifications/sync';
import { makeDevice } from '@/features/notifications/testing/fixtures';

jest.mock('@/features/shared/api/device', () => ({
  currentDevice: jest.fn(),
  sendTestPush: jest.fn(),
}));
jest.mock('@/features/notifications/sync', () => ({ syncPushRegistration: jest.fn() }));

const allowed = { granted: true, canAskAgain: true };
const notYet = { granted: false, canAskAgain: true };
const refused = { granted: false, canAskAgain: false };

function wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function serverHas(overrides: Parameters<typeof makeDevice>[0] = {}) {
  jest.mocked(currentDevice).mockResolvedValue({ message: 'OK', data: makeDevice(overrides) });
}

async function render() {
  const { result } = await renderHook(() => useNotificationsSection(), { wrapper });
  return result;
}

let appStateListener: ((status: AppStateStatus) => void) | null = null;

beforeEach(() => {
  jest.clearAllMocks();
  useToastStore.setState({ toast: null });
  jest.mocked(pushConfigured).mockReturnValue(true);
  jest.mocked(readPushPermission).mockResolvedValue(notYet);
  serverHas();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    appStateListener = listener as (status: AppStateStatus) => void;
    return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
  });
});

test('describes the phone the server recorded', () => {
  expect(describeDevice(makeDevice())).toBe('iPhone 17 Pro · iOS 27.2');
  expect(describeDevice(makeDevice({ name: null, os_version: null }))).toBe('iOS');
});

test('allowed and holding a token: a test push shows the backend message as a toast', async () => {
  jest.mocked(readPushPermission).mockResolvedValue(allowed);
  serverHas({ push_notifications_enabled: true });
  jest
    .mocked(sendTestPush)
    .mockResolvedValueOnce({ message: 'Probno obaveštenje je poslato.', data: null });

  const result = await render();
  await waitFor(() => expect(result.current.state).toBe('enabled'));
  expect(result.current.status).toBe('Uključena na ovom uređaju.');
  expect(result.current.action?.label).toBe('Pošalji probno obaveštenje');

  await act(async () => result.current.action?.onPress());

  await waitFor(() =>
    expect(useToastStore.getState().toast?.message).toBe('Probno obaveštenje je poslato.')
  );
});

test('a refused test push shows the backend message next to the section', async () => {
  jest.mocked(readPushPermission).mockResolvedValue(allowed);
  serverHas({ push_notifications_enabled: true });
  jest
    .mocked(sendTestPush)
    .mockRejectedValueOnce(new ApiError(409, 'Obaveštenja nisu uključena na ovom uređaju.', 'r'));

  const result = await render();
  await waitFor(() => expect(result.current.state).toBe('enabled'));
  await act(async () => result.current.action?.onPress());

  await waitFor(() =>
    expect(result.current.error).toBe('Obaveštenja nisu uključena na ovom uređaju.')
  );
});

test('allowed, but no EAS project: it says sending is not set up and offers nothing', async () => {
  jest.mocked(pushConfigured).mockReturnValue(false);
  jest.mocked(readPushPermission).mockResolvedValue(allowed);

  const result = await render();

  await waitFor(() => expect(result.current.state).toBe('unconfigured'));
  expect(result.current.deviceLine).toBe('iPhone 17 Pro · iOS 27.2');
  expect(result.current.action).toBeNull();
});

test('allowed and configured, but no token on the server: it offers to try again', async () => {
  jest.mocked(readPushPermission).mockResolvedValue(allowed);

  const result = await render();

  await waitFor(() => expect(result.current.state).toBe('unregistered'));
  expect(result.current.action?.label).toBe('Pokušaj ponovo');
});

test('not allowed yet: the button asks again, and the answer is taken', async () => {
  jest.mocked(syncPushRegistration).mockResolvedValueOnce({
    device: makeDevice({ push_notifications_enabled: true }),
    permission: allowed,
  });

  const result = await render();
  await waitFor(() => expect(result.current.state).toBe('disabled'));
  expect(result.current.action?.label).toBe('Uključi obaveštenja');

  await act(async () => result.current.action?.onPress());

  expect(syncPushRegistration).toHaveBeenCalledWith({ prompt: true }, expect.anything());
  await waitFor(() => expect(result.current.state).toBe('enabled'));
});

test('refused for good: the way back is the settings app', async () => {
  jest.mocked(readPushPermission).mockResolvedValue(refused);
  const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);

  const result = await render();
  await waitFor(() => expect(result.current.state).toBe('blocked'));
  expect(result.current.action?.label).toBe('Otvori podešavanja');

  await act(async () => result.current.action?.onPress());

  expect(openSettings).toHaveBeenCalled();
});

test('switched on in the settings app: coming back registers the phone without asking', async () => {
  jest.mocked(readPushPermission).mockResolvedValue(refused);
  jest.mocked(syncPushRegistration).mockResolvedValueOnce({
    device: makeDevice({ push_notifications_enabled: true }),
    permission: allowed,
  });

  const result = await render();
  await waitFor(() => expect(result.current.state).toBe('blocked'));

  jest.mocked(readPushPermission).mockResolvedValue(allowed);
  await act(async () => appStateListener?.('active'));

  await waitFor(() =>
    expect(syncPushRegistration).toHaveBeenCalledWith({ prompt: false }, expect.anything())
  );
  await waitFor(() => expect(result.current.state).toBe('enabled'));
});

test('coming back with nothing changed sends nothing', async () => {
  const result = await render();
  await waitFor(() => expect(result.current.state).toBe('disabled'));

  await act(async () => appStateListener?.('active'));

  expect(syncPushRegistration).not.toHaveBeenCalled();
});

test('a session without a phone is an error with a retry', async () => {
  jest
    .mocked(currentDevice)
    .mockRejectedValue(new ApiError(404, 'Ovaj uređaj nije registrovan.', 'r'));

  const result = await render();

  await waitFor(() => expect(result.current.state).toBe('error'));
  expect(result.current.action?.label).toBe('Pokušaj ponovo');
});
