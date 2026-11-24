import { act, renderHook } from '@testing-library/react-native';

import { appleSignInAvailable, signInWithApple } from '@/lib/apple-sign-in';
import { deleteAccount } from '@/features/account/api/account';
import { useDeleteAccount } from '@/features/account/hooks/use-delete-account';
import { useSessionStore } from '@/features/shared/stores/session';
import { makeUser } from '@/features/shared/testing/fixtures';
import { queryWrapper } from '@/features/shared/testing/query-wrapper';

jest.mock('@/features/account/api/account', () => ({ deleteAccount: jest.fn() }));
jest.mock('@/lib/apple-sign-in', () => ({
  appleSignInAvailable: jest.fn(),
  signInWithApple: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(deleteAccount).mockResolvedValue({ message: 'Nalog je obrisan.', data: null });
});

async function deletion(onDeleted = jest.fn(async () => undefined)) {
  const { result } = await renderHook(() => useDeleteAccount(onDeleted), {
    wrapper: queryWrapper(),
  });
  return { result, onDeleted };
}

test('nothing happens until the deletion is confirmed', async () => {
  useSessionStore.setState({ status: 'signedIn', user: makeUser() });
  const { result } = await deletion();

  await act(() => result.current.request());
  expect(result.current.confirming).toBe(true);
  await act(() => result.current.cancel());

  expect(deleteAccount).not.toHaveBeenCalled();
});

test('a plain account is deleted and the session ends', async () => {
  useSessionStore.setState({ status: 'signedIn', user: makeUser() });
  const { result, onDeleted } = await deletion();

  await act(() => result.current.request());
  await act(() => result.current.confirm());

  expect(signInWithApple).not.toHaveBeenCalled();
  expect(deleteAccount).toHaveBeenCalledWith(null);
  expect(onDeleted).toHaveBeenCalled();
});

test('an Apple account asks Apple for a fresh code first', async () => {
  useSessionStore.setState({ status: 'signedIn', user: makeUser({ has_apple: true }) });
  jest.mocked(appleSignInAvailable).mockResolvedValue(true);
  jest.mocked(signInWithApple).mockResolvedValueOnce({
    idToken: 'jwt',
    nonce: 'n',
    authorizationCode: 'fresh',
    email: null,
    givenName: null,
    familyName: null,
  });
  const { result } = await deletion();

  await act(() => result.current.confirm());

  expect(deleteAccount).toHaveBeenCalledWith('fresh');
});

test('backing out of Apple still deletes — the person already confirmed', async () => {
  useSessionStore.setState({ status: 'signedIn', user: makeUser({ has_apple: true }) });
  jest.mocked(appleSignInAvailable).mockResolvedValue(true);
  jest.mocked(signInWithApple).mockResolvedValueOnce(null);
  const { result, onDeleted } = await deletion();

  await act(() => result.current.confirm());

  expect(deleteAccount).toHaveBeenCalledWith(null);
  expect(onDeleted).toHaveBeenCalled();
});

test('a failed deletion keeps the session and says why', async () => {
  useSessionStore.setState({ status: 'signedIn', user: makeUser() });
  jest.mocked(deleteAccount).mockRejectedValueOnce(new Error('boom'));
  const { result, onDeleted } = await deletion();

  await act(() => result.current.confirm());

  expect(onDeleted).not.toHaveBeenCalled();
  expect(result.current.error).toBe('Došlo je do neočekivane greške. Pokušajte ponovo.');
});
