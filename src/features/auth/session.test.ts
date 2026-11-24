import { QueryObserver } from '@tanstack/react-query';

import { ApiError, request, setAuthToken } from '@/lib/http';
import { queryClient } from '@/lib/query-client';
import { deleteToken, readToken, writeToken } from '@/lib/secure-store';
import { create } from '@/lib/zustand';
import { endSession, restoreSession, startSession } from '@/features/auth/session';
import { useSessionStore } from '@/features/shared/stores/session';
import type { User } from '@/features/shared/schemas/user';

jest.mock('@/lib/secure-store', () => ({
  readToken: jest.fn(),
  writeToken: jest.fn(),
  deleteToken: jest.fn(),
}));

jest.mock('@/lib/http', () => ({
  ...jest.requireActual('@/lib/http'),
  request: jest.fn(),
  setAuthToken: jest.fn(),
}));

const readTokenMock = readToken as jest.MockedFunction<typeof readToken>;
const requestMock = request as jest.MockedFunction<typeof request>;

const user: User = {
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

/** A feature store, to prove signing out wipes every store made through `@/lib/zustand`. */
const useDraftStore = create<{ draft: string }>(() => ({ draft: '' }));

beforeEach(() => {
  jest.clearAllMocks();
  useSessionStore.setState({ status: 'loading', user: null });
});

test('startSession persists the token and signs the user in', async () => {
  await startSession('token-1', user);

  expect(setAuthToken).toHaveBeenCalledWith('token-1');
  expect(writeToken).toHaveBeenCalledWith('token-1');
  expect(useSessionStore.getState()).toMatchObject({ status: 'signedIn', user });
});

test('endSession forgets the token and flushes every query and store', async () => {
  useSessionStore.setState({ status: 'signedIn', user });
  useDraftStore.setState({ draft: 'unsent text' });
  queryClient.setQueryData(['users'], [user]);

  await endSession();

  expect(setAuthToken).toHaveBeenCalledWith(null);
  expect(deleteToken).toHaveBeenCalled();
  expect(queryClient.getQueryData(['users'])).toBeUndefined();
  expect(useDraftStore.getState().draft).toBe('');
  expect(useSessionStore.getState()).toMatchObject({ status: 'signedOut', user: null });
});

test('endSession keeps what belongs to the app, not the user', async () => {
  // A query the app needs signed in or not (the minimum version), still being watched.
  const observer = new QueryObserver(queryClient, {
    queryKey: ['app-version', 'policy'],
    queryFn: async () => ({ minimum_version: '2.0.0' }),
    meta: { keepOnSignOut: true },
  });
  const unsubscribe = observer.subscribe(() => {});
  queryClient.setQueryData(['users'], [user]);

  await endSession();

  expect(queryClient.getQueryData(['users'])).toBeUndefined();
  expect(queryClient.getQueryCache().find({ queryKey: ['app-version', 'policy'] })).toBeDefined();
  unsubscribe();
});

test('launch without a token goes straight to signed out', async () => {
  readTokenMock.mockResolvedValueOnce(null);

  await restoreSession();

  expect(requestMock).not.toHaveBeenCalled();
  expect(useSessionStore.getState().status).toBe('signedOut');
});

test('launch with a valid token checks it with /auth/me and signs in', async () => {
  readTokenMock.mockResolvedValueOnce('stored');
  requestMock.mockResolvedValueOnce({ message: 'Podaci o nalogu.', data: user });

  await restoreSession();

  expect(requestMock).toHaveBeenCalledWith('/auth/me');
  expect(useSessionStore.getState()).toMatchObject({ status: 'signedIn', user });
});

test.each([401, 403])('a token the API rejects with %i is deleted', async (status) => {
  readTokenMock.mockResolvedValueOnce('dead');
  requestMock.mockRejectedValueOnce(new ApiError(status, 'no', 'r'));

  await restoreSession();

  expect(deleteToken).toHaveBeenCalled();
  expect(useSessionStore.getState().status).toBe('signedOut');
});

test('being offline at launch signs out but keeps the token for next time', async () => {
  readTokenMock.mockResolvedValueOnce('stored');
  requestMock.mockRejectedValueOnce(new ApiError(0, 'offline', 'r'));

  await restoreSession();

  expect(deleteToken).not.toHaveBeenCalled();
  expect(useSessionStore.getState().status).toBe('signedOut');
});
