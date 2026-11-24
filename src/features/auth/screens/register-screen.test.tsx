import { render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { ApiError } from '@/lib/http';
import { registerWithGoogleToken, requestRegistrationCode } from '@/features/auth/api/auth';
import { RegisterScreen } from '@/features/auth/screens/register-screen';
import { startSession } from '@/features/auth/session';
import { useAuthFlowStore } from '@/features/auth/stores/auth-flow';
import { makeUser } from '@/features/shared/testing/fixtures';
import {
  buttonText,
  isSwitchOn,
  pressButton,
  setSwitch,
  typeText,
} from '@/features/shared/testing/native-ui';
import { queryWrapper } from '@/features/shared/testing/query-wrapper';

jest.mock('expo-router/stack', () => ({ Stack: { Title: () => null } }));
// The palette reads `Color` from expo-router; only the navigation is replaced.
jest.mock('expo-router', () => ({
  ...jest.requireActual<typeof import('expo-router')>('expo-router'),
  router: { push: jest.fn() },
}));
jest.mock('@/features/auth/api/auth', () => ({
  requestRegistrationCode: jest.fn(),
  registerWithGoogleToken: jest.fn(),
  registerWithAppleToken: jest.fn(),
}));
jest.mock('@/features/auth/session', () => ({ startSession: jest.fn() }));
jest.mock('expo-image-picker', () => ({}));

/**
 * The registration form as it is shown and filled in: the fields, the switch, the messages, and
 * the two ways it ends — a code (address) or an account at once (Google / Apple). What each answer
 * does to the flow is in `useRegisterForm`'s tests.
 */

beforeEach(() => {
  jest.clearAllMocks();
  useAuthFlowStore.setState({ email: 'jovana.petrovic@example.com', provider: null });
});

async function renderScreen() {
  const Wrapper = queryWrapper();
  await render(
    <Wrapper>
      <RegisterScreen />
    </Wrapper>
  );
}

test('asks for the address, a username, an optional name and picture — the name hidden at first', async () => {
  await renderScreen();

  for (const label of [
    'Profilna slika (opciono)',
    'Email',
    'Korisničko ime',
    'Ime (opciono)',
    'Prezime (opciono)',
  ]) {
    expect(screen.getByText(label)).toBeOnTheScreen();
  }
  expect(isSwitchOn('register-display-name')).toBe(false);
  expect(buttonText('register-submit')).toBe('Pošalji kod');
  expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
});

test('sends the address, the suggested username and the name to the code screen', async () => {
  jest
    .mocked(requestRegistrationCode)
    .mockResolvedValueOnce({ message: 'Poslali smo kod.', data: { retry_after: 30 } });
  await renderScreen();

  await typeText('register-first-name', 'Jovana');
  await setSwitch('register-display-name', true);
  await pressButton('register-submit');

  expect(requestRegistrationCode).toHaveBeenCalledWith(
    'jovana.petrovic@example.com',
    'jovana.petrovic'
  );
  expect(router.push).toHaveBeenCalledWith('/code');
  expect(useAuthFlowStore.getState().purpose).toEqual({
    kind: 'register',
    profile: expect.objectContaining({
      username: 'jovana.petrovic',
      first_name: 'Jovana',
      display_personal_name: true,
    }),
    avatar: null,
  });
});

test('a username the backend would refuse is caught on the phone, nothing is sent', async () => {
  await renderScreen();

  await typeText('register-username', 'Jo Vana');
  await pressButton('register-submit');

  expect(
    screen.getByText('Korisničko ime sme da sadrži samo mala slova, brojeve, tačku i donju crtu.')
  ).toBeOnTheScreen();
  expect(requestRegistrationCode).not.toHaveBeenCalled();

  await typeText('register-username', 'jo');
  await pressButton('register-submit');
  expect(screen.getByText('Korisničko ime mora imati najmanje 3 znaka.')).toBeOnTheScreen();
  expect(requestRegistrationCode).not.toHaveBeenCalled();
});

test('a malformed address is caught on the phone', async () => {
  await renderScreen();

  await typeText('register-email', 'jovana@');
  await pressButton('register-submit');

  expect(screen.getByText('Email adresa nije ispravna.')).toBeOnTheScreen();
  expect(requestRegistrationCode).not.toHaveBeenCalled();
});

test('a username already taken comes back under its field, and editing it clears the message', async () => {
  jest.mocked(requestRegistrationCode).mockRejectedValueOnce(
    new ApiError(422, 'Korisničko ime je zauzeto.', 'req', {
      username: ['Korisničko ime je zauzeto.'],
    })
  );
  await renderScreen();

  await pressButton('register-submit');

  expect(screen.getByText('Korisničko ime je zauzeto.')).toBeOnTheScreen();
  expect(router.push).not.toHaveBeenCalled();

  await typeText('register-username', 'jovana.p');
  expect(screen.queryByText('Korisničko ime je zauzeto.')).not.toBeOnTheScreen();
});

test('after Google: the address is shown, not editable, the name is filled in, and the account is made here', async () => {
  jest
    .mocked(registerWithGoogleToken)
    .mockResolvedValueOnce({ message: 'OK', data: { token: 't', user: makeUser() } });
  useAuthFlowStore.setState({
    provider: {
      proof: { provider: 'google', idToken: 'id-token' },
      email: 'jovana@gmail.com',
      givenName: 'Jovana',
      familyName: 'Petrović',
    },
  });
  await renderScreen();

  expect(screen.getByText('jovana@gmail.com')).toBeOnTheScreen();
  expect(screen.queryByTestId('register-email')).not.toBeOnTheScreen();
  expect(buttonText('register-submit')).toBe('Napravi nalog');

  await pressButton('register-submit');

  expect(registerWithGoogleToken).toHaveBeenCalledWith(
    'id-token',
    expect.objectContaining({ username: 'jovana', first_name: 'Jovana', last_name: 'Petrović' }),
    null
  );
  expect(startSession).toHaveBeenCalledWith('t', makeUser());
  expect(requestRegistrationCode).not.toHaveBeenCalled();
});
