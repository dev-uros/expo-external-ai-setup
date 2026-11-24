import { act, renderHook } from '@testing-library/react-native';
import { router } from 'expo-router';

import { signInWithGoogle } from '@/lib/google-sign-in';
import { ApiError } from '@/lib/http';
import { requestSignInCode, signInWithGoogleToken } from '@/features/auth/api/auth';
import { useWelcome } from '@/features/auth/hooks/use-welcome';
import { startSession } from '@/features/auth/session';
import { useAuthFlowStore } from '@/features/auth/stores/auth-flow';
import { makeUser } from '@/features/shared/testing/fixtures';
import { queryWrapper } from '@/features/shared/testing/query-wrapper';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), dismissTo: jest.fn() } }));
jest.mock('@/features/auth/api/auth', () => ({
  requestSignInCode: jest.fn(),
  signInWithGoogleToken: jest.fn(),
  signInWithAppleToken: jest.fn(),
}));
jest.mock('@/features/auth/session', () => ({ startSession: jest.fn() }));
jest.mock('@/lib/google-sign-in', () => ({ signInWithGoogle: jest.fn() }));
jest.mock('@/lib/apple-sign-in', () => ({ signInWithApple: jest.fn() }));

const push = router.push as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  useAuthFlowStore.setState({ email: '', provider: null, purpose: { kind: 'sign-in' } });
});

async function welcome() {
  return (await renderHook(() => useWelcome(), { wrapper: queryWrapper() })).result;
}

test('an address with an account goes to the code screen, with the wait', async () => {
  jest.mocked(requestSignInCode).mockResolvedValueOnce({
    message: 'Poslali smo kod.',
    data: { account_exists: true, retry_after: 30 },
  });
  const result = await welcome();

  await act(() => result.current.editEmail(' Ana@Example.com '));
  await act(() => void result.current.submitEmail());

  expect(requestSignInCode).toHaveBeenCalledWith('ana@example.com');
  expect(push).toHaveBeenCalledWith('/code');
  expect(useAuthFlowStore.getState().email).toBe('ana@example.com');
  expect(useAuthFlowStore.getState().resendAt).toBeGreaterThan(Date.now());
});

test('an address without an account goes to registration', async () => {
  jest.mocked(requestSignInCode).mockResolvedValueOnce({
    message: 'Ne postoji nalog.',
    data: { account_exists: false, retry_after: 0 },
  });
  const result = await welcome();

  await act(() => result.current.editEmail('nova@example.com'));
  await act(() => void result.current.submitEmail());

  expect(push).toHaveBeenCalledWith('/register');
  expect(useAuthFlowStore.getState().email).toBe('nova@example.com');
});

test('a code asked for a moment ago still opens the code screen, counting down from Retry-After', async () => {
  jest
    .mocked(requestSignInCode)
    .mockRejectedValueOnce(new ApiError(429, 'Sačekajte.', 'r', undefined, 42));
  const result = await welcome();

  await act(() => result.current.editEmail('ana@example.com'));
  await act(() => void result.current.submitEmail());

  expect(push).toHaveBeenCalledWith('/code');
  const left = (useAuthFlowStore.getState().resendAt - Date.now()) / 1000;
  expect(left).toBeGreaterThan(40);
  expect(left).toBeLessThanOrEqual(42);
});

test('a bad address is caught on the phone, nothing is sent', async () => {
  const result = await welcome();

  await act(() => result.current.editEmail('nope'));
  await act(() => void result.current.submitEmail());

  expect(result.current.fieldError).toBe('Email adresa nije ispravna.');
  expect(requestSignInCode).not.toHaveBeenCalled();
});

test('Google with an account signs in; without one goes to registration with the proof', async () => {
  jest.mocked(signInWithGoogle).mockResolvedValue({
    idToken: 'jwt',
    email: 'ana@gmail.com',
    givenName: 'Ana',
    familyName: null,
  });
  jest.mocked(signInWithGoogleToken).mockResolvedValueOnce({
    message: 'OK',
    data: { token: 't', user: makeUser() },
  });
  const result = await welcome();

  await act(() => result.current.continueWith('google'));
  expect(startSession).toHaveBeenCalledWith('t', makeUser());

  jest.mocked(signInWithGoogleToken).mockRejectedValueOnce(new ApiError(404, 'Nema naloga.', 'r'));
  await act(() => result.current.continueWith('google'));

  expect(push).toHaveBeenCalledWith('/register');
  expect(useAuthFlowStore.getState().provider).toEqual({
    proof: { provider: 'google', idToken: 'jwt' },
    email: 'ana@gmail.com',
    givenName: 'Ana',
    familyName: null,
  });
});

test('Google on an address that may not be linked (409) shows the server message', async () => {
  jest.mocked(signInWithGoogle).mockResolvedValueOnce({
    idToken: 'jwt',
    email: 'ana@yahoo.com',
    givenName: null,
    familyName: null,
  });
  jest
    .mocked(signInWithGoogleToken)
    .mockRejectedValueOnce(new ApiError(409, 'Prijavite se kodom na email.', 'r'));
  const result = await welcome();

  await act(() => result.current.continueWith('google'));

  expect(result.current.message).toBe('Prijavite se kodom na email.');
  expect(push).not.toHaveBeenCalled();
});

test('backing out of Google does nothing', async () => {
  jest.mocked(signInWithGoogle).mockResolvedValueOnce(null);
  const result = await welcome();

  await act(() => result.current.continueWith('google'));

  expect(signInWithGoogleToken).not.toHaveBeenCalled();
  expect(result.current.message).toBeNull();
});
