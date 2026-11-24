import { act, renderHook, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { ApiError } from '@/lib/http';
import { registerWithAppleToken, requestRegistrationCode } from '@/features/auth/api/auth';
import { useRegisterForm } from '@/features/auth/hooks/use-register-form';
import { startSession } from '@/features/auth/session';
import { useAuthFlowStore } from '@/features/auth/stores/auth-flow';
import { makeUser } from '@/features/shared/testing/fixtures';
import { queryWrapper } from '@/features/shared/testing/query-wrapper';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/auth/api/auth', () => ({
  requestRegistrationCode: jest.fn(),
  registerWithGoogleToken: jest.fn(),
  registerWithAppleToken: jest.fn(),
}));
jest.mock('@/features/auth/session', () => ({ startSession: jest.fn() }));
jest.mock('expo-image-picker', () => ({}));

beforeEach(() => {
  jest.clearAllMocks();
  useAuthFlowStore.setState({ email: 'jovana.petrovic@example.com', provider: null });
});

async function form() {
  return (await renderHook(() => useRegisterForm(), { wrapper: queryWrapper() })).result;
}

test('starts from the typed address and a username made from it', async () => {
  const result = await form();

  expect(result.current.values.email).toBe('jovana.petrovic@example.com');
  expect(result.current.values.username).toBe('jovana.petrovic');
  expect(result.current.emailLocked).toBe(false);
});

test('with an address, a code is asked for and the profile goes with it to the code screen', async () => {
  jest.mocked(requestRegistrationCode).mockResolvedValueOnce({
    message: 'Poslali smo kod.',
    data: { retry_after: 30 },
  });
  const result = await form();

  await act(() => result.current.edit('first_name', ' Jovana '));
  await act(() => result.current.edit('display_personal_name', true));
  await act(() => void result.current.submit());

  expect(requestRegistrationCode).toHaveBeenCalledWith(
    'jovana.petrovic@example.com',
    'jovana.petrovic'
  );
  expect(router.push).toHaveBeenCalledWith('/code');
  expect(useAuthFlowStore.getState().purpose).toEqual({
    kind: 'register',
    profile: {
      username: 'jovana.petrovic',
      first_name: 'Jovana',
      last_name: null,
      display_personal_name: true,
    },
    avatar: null,
  });
});

test('a taken username comes back under its field', async () => {
  jest.mocked(requestRegistrationCode).mockRejectedValueOnce(
    new ApiError(422, 'Vrednost je zauzeta.', 'r', {
      username: ['Vrednost polja korisničko ime je već zauzeta.'],
    })
  );
  const result = await form();

  await act(() => void result.current.submit());

  await waitFor(() =>
    expect(result.current.fieldError('username')).toBe(
      'Vrednost polja korisničko ime je već zauzeta.'
    )
  );
  expect(router.push).not.toHaveBeenCalled();
});

test('a bad username is caught on the phone', async () => {
  const result = await form();

  await act(() => result.current.edit('username', 'ne valja!'));
  await act(() => void result.current.submit());

  expect(result.current.fieldError('username')).toBe(
    'Korisničko ime sme da sadrži samo mala slova, brojeve, tačku i donju crtu.'
  );
  expect(requestRegistrationCode).not.toHaveBeenCalled();
});

test('after Apple, the address is fixed, the name pre-filled, and the account made here', async () => {
  const proof = {
    provider: 'apple' as const,
    idToken: 'jwt',
    nonce: 'raw',
    authorizationCode: 'code',
  };
  useAuthFlowStore.setState({
    provider: {
      proof,
      email: 'x7f@privaterelay.appleid.com',
      givenName: 'Ana',
      familyName: 'Anić',
    },
  });
  jest.mocked(registerWithAppleToken).mockResolvedValueOnce({
    message: 'Nalog je napravljen.',
    data: { token: 't', user: makeUser() },
  });
  const result = await form();

  expect(result.current.emailLocked).toBe(true);
  expect(result.current.values.first_name).toBe('Ana');
  await act(() => void result.current.submit());

  expect(registerWithAppleToken).toHaveBeenCalledWith(
    proof,
    { username: 'x7f', first_name: 'Ana', last_name: 'Anić', display_personal_name: false },
    null
  );
  expect(startSession).toHaveBeenCalledWith('t', makeUser());
});
