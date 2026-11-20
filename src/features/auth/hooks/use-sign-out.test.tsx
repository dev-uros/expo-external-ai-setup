import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { logout } from '@/features/auth/api/session';
import { useSignOut } from '@/features/auth/hooks/use-sign-out';
import { endSession } from '@/features/auth/session';

jest.mock('@/features/auth/api/session', () => ({ logout: jest.fn() }));
jest.mock('@/features/auth/session', () => ({ endSession: jest.fn() }));

const logoutMock = logout as jest.MockedFunction<typeof logout>;

function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

async function renderSignOut() {
  const { result } = await renderHook(() => useSignOut(), { wrapper });
  return result;
}

beforeEach(() => {
  jest.clearAllMocks();
  logoutMock.mockResolvedValue({ message: 'Uspešno ste odjavljeni.', data: null });
});

test('asking opens the confirmation and signs nobody out', async () => {
  const signOut = await renderSignOut();

  await act(() => signOut.current.requestSignOut());

  expect(signOut.current.confirming).toBe(true);
  expect(logoutMock).not.toHaveBeenCalled();
});

test('cancelling — or dismissing with back — closes it and keeps the session', async () => {
  const signOut = await renderSignOut();
  await act(() => signOut.current.requestSignOut());

  await act(() => signOut.current.cancel());

  expect(signOut.current.confirming).toBe(false);
  expect(logoutMock).not.toHaveBeenCalled();
  expect(endSession).not.toHaveBeenCalled();
});

test('confirming closes it, signs out and ends the session', async () => {
  const signOut = await renderSignOut();
  await act(() => signOut.current.requestSignOut());

  await act(() => signOut.current.confirm());

  expect(signOut.current.confirming).toBe(false);
  expect(logoutMock).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(endSession).toHaveBeenCalled());
});

test('the session ends even when the server cannot be reached', async () => {
  logoutMock.mockRejectedValueOnce(new Error('offline'));
  const signOut = await renderSignOut();
  await act(() => signOut.current.requestSignOut());

  await act(() => signOut.current.confirm());

  await waitFor(() => expect(endSession).toHaveBeenCalled());
});

test('no second confirmation while signing out', async () => {
  logoutMock.mockReturnValueOnce(new Promise(() => {}));
  const signOut = await renderSignOut();
  await act(() => signOut.current.requestSignOut());
  await act(() => signOut.current.confirm());
  await waitFor(() => expect(signOut.current.isPending).toBe(true));

  await act(() => signOut.current.requestSignOut());

  expect(signOut.current.confirming).toBe(false);
});
