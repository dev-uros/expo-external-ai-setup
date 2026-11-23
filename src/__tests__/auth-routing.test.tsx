import { act } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';

import { ApiError, request } from '@/lib/http';
import { readToken } from '@/lib/secure-store';
import { endSession } from '@/features/auth/session';
import { useSessionStore } from '@/features/shared/stores/session';

/**
 * The launch decision and the guards, against the real `src/app` routes: which half of the app
 * a user can reach follows the session status alone.
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

const readTokenMock = readToken as jest.MockedFunction<typeof readToken>;
const requestMock = request as jest.MockedFunction<typeof request>;

const user = {
  id: 1,
  name: 'Ana',
  surname: 'Anić',
  email: 'ana@firma.com',
  role: 'admin',
  avatar_url: null,
  deactivated_at: null,
  email_verified_at: '2026-01-01T10:00:00+00:00',
  created_at: '2026-01-01T10:00:00+00:00',
  updated_at: '2026-01-01T10:00:00+00:00',
};

beforeEach(() => {
  jest.clearAllMocks();
  useSessionStore.setState({ status: 'loading', user: null });
});

test('no stored token: the login screen, and nothing behind it', async () => {
  readTokenMock.mockResolvedValueOnce(null);

  await renderRouter('./src/app');

  expect(await screen.findByText('Prijavite se svojim poslovnim nalogom.')).toBeOnTheScreen();
  expect(screen).toHavePathname('/login');
  expect(requestMock).not.toHaveBeenCalled();
});

test('a valid stored token: straight to home, greeted by name', async () => {
  readTokenMock.mockResolvedValueOnce('stored');
  requestMock.mockResolvedValueOnce({ message: 'Podaci o nalogu.', data: user });

  await renderRouter('./src/app');

  expect(await screen.findByText('Dobro došli, Ana.')).toBeOnTheScreen();
  expect(screen).toHavePathname('/');
});

test('a rejected stored token: back to login', async () => {
  readTokenMock.mockResolvedValueOnce('dead');
  requestMock.mockRejectedValueOnce(new ApiError(401, 'Unauthenticated.', 'r'));

  await renderRouter('./src/app');

  expect(await screen.findByText('Prijavite se svojim poslovnim nalogom.')).toBeOnTheScreen();
  expect(screen).toHavePathname('/login');
});

test('signing out from inside the app lands on login', async () => {
  readTokenMock.mockResolvedValueOnce('stored');
  requestMock.mockResolvedValueOnce({ message: 'Podaci o nalogu.', data: user });
  await renderRouter('./src/app');
  await screen.findByText('Dobro došli, Ana.');

  await act(() => endSession());

  expect(await screen.findByText('Prijavite se svojim poslovnim nalogom.')).toBeOnTheScreen();
  expect(screen).toHavePathname('/login');
});

test('a signed-in deep link to a user that cannot exist lands on "no such user"', async () => {
  readTokenMock.mockResolvedValueOnce('stored');
  requestMock.mockResolvedValueOnce({ message: 'Podaci o nalogu.', data: user });

  await renderRouter('./src/app', { initialUrl: '/users/abc' });

  expect(await screen.findByText('Korisnik ne postoji')).toBeOnTheScreen();
  expect(screen).toHavePathname('/users/abc');
  // An id that is not an id never reaches the server.
  expect(requestMock).not.toHaveBeenCalledWith('/users/abc', expect.anything());
  expect(requestMock.mock.calls.map(([path]) => path)).not.toContain('/users/abc');
});

test('a deep link that arrives at launch survives the session check', async () => {
  readTokenMock.mockResolvedValueOnce('stored');
  requestMock
    .mockResolvedValueOnce({ message: 'Podaci o nalogu.', data: user })
    .mockResolvedValueOnce({
      message: 'Korisnik uspešno učitan.',
      data: { ...user, id: 7, name: 'Marko', surname: 'Petrović', email: 'marko@firma.com' },
    });

  await renderRouter('./src/app', { initialUrl: '/users/7' });

  expect(await screen.findByLabelText('Email: marko@firma.com')).toBeOnTheScreen();
  expect(screen).toHavePathname('/users/7');
  expect(requestMock).toHaveBeenCalledWith('/users/7');
  // The signed-in app also records this phone for the session (internal_user_devices).
  expect(requestMock).toHaveBeenCalledWith(
    '/auth/device',
    expect.objectContaining({ method: 'PUT' })
  );
});
