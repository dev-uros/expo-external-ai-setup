import { act, renderHook } from '@testing-library/react-native';

import { ApiError } from '@/lib/http';
import { registerWithCode, requestSignInCode, signInWithCode } from '@/features/auth/api/auth';
import { useCodeForm } from '@/features/auth/hooks/use-code-form';
import { startSession } from '@/features/auth/session';
import { useAuthFlowStore } from '@/features/auth/stores/auth-flow';
import { useToastStore } from '@/features/shared/stores/toast';
import { makeUser } from '@/features/shared/testing/fixtures';
import { queryWrapper } from '@/features/shared/testing/query-wrapper';

jest.mock('@/features/auth/api/auth', () => ({
  requestSignInCode: jest.fn(),
  requestRegistrationCode: jest.fn(),
  signInWithCode: jest.fn(),
  registerWithCode: jest.fn(),
}));
jest.mock('@/features/auth/session', () => ({ startSession: jest.fn() }));

const signedIn = { message: 'OK', data: { token: 't', user: makeUser() } };
const profile = {
  username: 'nova',
  first_name: null,
  last_name: null,
  display_personal_name: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: 1_000_000 });
  useAuthFlowStore.getState().codeSent('ana@example.com', { kind: 'sign-in' }, 30);
});
afterEach(() => jest.useRealTimers());

async function form() {
  return (await renderHook(() => useCodeForm(), { wrapper: queryWrapper() })).result;
}

test('the sixth digit sends the code; anything but digits is dropped', async () => {
  jest.mocked(signInWithCode).mockResolvedValueOnce(signedIn);
  const result = await form();

  await act(() => result.current.editCode('12 3'));
  expect(signInWithCode).not.toHaveBeenCalled();
  await act(() => result.current.editCode('123456'));

  expect(signInWithCode).toHaveBeenCalledWith('ana@example.com', '123456');
  expect(startSession).toHaveBeenCalledWith('t', makeUser());
});

test('a code pasted with spaces still counts', async () => {
  jest.mocked(signInWithCode).mockResolvedValueOnce(signedIn);
  const result = await form();

  await act(() => result.current.editCode(' 123 456 '));

  expect(signInWithCode).toHaveBeenCalledWith('ana@example.com', '123456');
});

test('a wrong code clears the digits and says why', async () => {
  jest
    .mocked(signInWithCode)
    .mockRejectedValueOnce(new ApiError(422, 'Kod nije ispravan ili je istekao.', 'r'));
  const result = await form();

  await act(() => result.current.editCode('000000'));

  expect(result.current.code).toBe('');
  expect(result.current.message).toBe('Kod nije ispravan ili je istekao.');
});

test('a registration code makes the account with the profile from the form', async () => {
  useAuthFlowStore
    .getState()
    .codeSent('nova@example.com', { kind: 'register', profile, avatar: null }, 30);
  jest.mocked(registerWithCode).mockResolvedValueOnce(signedIn);
  const result = await form();

  await act(() => result.current.editCode('424242'));

  expect(registerWithCode).toHaveBeenCalledWith('nova@example.com', '424242', profile, null);
});

test('sending again waits for the countdown, then restarts it', async () => {
  jest.mocked(requestSignInCode).mockResolvedValueOnce({
    message: 'Poslali smo kod.',
    data: { account_exists: true, retry_after: 30 },
  });
  const result = await form();

  expect(result.current.secondsLeft).toBe(30);
  expect(result.current.canResend).toBe(false);
  await act(() => result.current.resend());
  expect(requestSignInCode).not.toHaveBeenCalled();

  await act(() => jest.advanceTimersByTime(60_000));
  expect(result.current.canResend).toBe(true);
  await act(() => result.current.resend());

  expect(requestSignInCode).toHaveBeenCalledWith('ana@example.com');
  expect(useToastStore.getState().toast?.message).toBe('Poslali smo kod.');
  expect(result.current.secondsLeft).toBe(30);
});

test('a 429 on sending again takes the wait from Retry-After', async () => {
  jest
    .mocked(requestSignInCode)
    .mockRejectedValueOnce(new ApiError(429, 'Sačekajte.', 'r', undefined, 30));
  const result = await form();
  await act(() => jest.advanceTimersByTime(60_000));

  await act(() => result.current.resend());

  expect(result.current.secondsLeft).toBe(30);
  expect(result.current.message).toBe('Sačekajte.');
});
