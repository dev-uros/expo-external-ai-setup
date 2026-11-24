import { act } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';

import { ApiError, request } from '@/lib/http';
import { readToken } from '@/lib/secure-store';
import { endSession } from '@/features/auth/session';
import { useSessionStore } from '@/features/shared/stores/session';
import { makeUser } from '@/features/shared/testing/fixtures';

/**
 * The launch decision and the guards, against the real `src/app` routes: which half of the app
 * a person can reach follows the session status alone.
 */

jest.mock('@/lib/secure-store', () => ({
  readToken: jest.fn(),
  writeToken: jest.fn(),
  deleteToken: jest.fn(),
}));

jest.mock('@/lib/http', () => ({
  ...jest.requireActual('@/lib/http'),
  request: jest.fn(),
}));

// The minimum-version check runs in front of everything; it has its own test and lets the app run.
jest.mock('@/features/app-version/api/app-version', () => ({
  fetchAppVersionPolicy: jest.fn(async () => ({
    message: 'OK',
    data: { minimum_version: null, store_url: null },
  })),
}));

const readTokenMock = readToken as jest.MockedFunction<typeof readToken>;
const requestMock = request as jest.MockedFunction<typeof request>;
const user = makeUser({ display_name: 'Ana Anić', display_personal_name: true });
const welcome = 'Unesite email adresu i poslaćemo vam kod za prijavu.';

beforeEach(() => {
  jest.clearAllMocks();
  useSessionStore.setState({ status: 'loading', user: null });
});

test('no stored token: the welcome screen, and nothing behind it', async () => {
  readTokenMock.mockResolvedValueOnce(null);

  await renderRouter('./src/app');

  expect(await screen.findByText(welcome)).toBeOnTheScreen();
  expect(screen).toHavePathname('/welcome');
  expect(requestMock).not.toHaveBeenCalled();
});

test('a valid stored token: straight to home, greeted by the shown name', async () => {
  readTokenMock.mockResolvedValueOnce('stored');
  requestMock.mockResolvedValueOnce({ message: 'Podaci o nalogu.', data: user });

  await renderRouter('./src/app');

  expect(await screen.findByText('Ćao, Ana Anić')).toBeOnTheScreen();
  expect(screen).toHavePathname('/');
  expect(requestMock).toHaveBeenCalledWith('/mobile/v1/me');
});

test('a rejected stored token: back to the welcome screen', async () => {
  readTokenMock.mockResolvedValueOnce('dead');
  requestMock.mockRejectedValueOnce(new ApiError(401, 'Unauthenticated.', 'r'));

  await renderRouter('./src/app');

  expect(await screen.findByText(welcome)).toBeOnTheScreen();
  expect(screen).toHavePathname('/welcome');
});

test('a blocked account (403) is signed out too', async () => {
  readTokenMock.mockResolvedValueOnce('blocked');
  requestMock.mockRejectedValueOnce(new ApiError(403, 'Vaš nalog je blokiran.', 'r'));

  await renderRouter('./src/app');

  expect(await screen.findByText(welcome)).toBeOnTheScreen();
});

test('signing out from inside the app lands on the welcome screen', async () => {
  readTokenMock.mockResolvedValueOnce('stored');
  requestMock.mockResolvedValueOnce({ message: 'Podaci o nalogu.', data: user });
  await renderRouter('./src/app');
  await screen.findByText('Ćao, Ana Anić');

  await act(() => endSession());

  expect(await screen.findByText(welcome)).toBeOnTheScreen();
  expect(screen).toHavePathname('/welcome');
});

test('a deep link that arrives at launch survives the session check', async () => {
  readTokenMock.mockResolvedValueOnce('stored');
  requestMock.mockResolvedValueOnce({ message: 'Podaci o nalogu.', data: user });

  await renderRouter('./src/app', { initialUrl: '/settings' });

  expect(await screen.findByText('ana@example.com')).toBeOnTheScreen();
  expect(screen).toHavePathname('/settings');
  // The signed-in app also records this phone for the session (mobile_user_devices).
  expect(requestMock).toHaveBeenCalledWith(
    '/mobile/v1/device',
    expect.objectContaining({ method: 'PUT' })
  );
});
