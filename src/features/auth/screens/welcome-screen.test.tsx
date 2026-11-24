import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { appleSignInAvailable } from '@/lib/apple-sign-in';
import { googleSignInAvailable } from '@/lib/google-sign-in';
import { ApiError } from '@/lib/http';
import { requestSignInCode } from '@/features/auth/api/auth';
import { WelcomeScreen } from '@/features/auth/screens/welcome-screen';
import { useAuthFlowStore } from '@/features/auth/stores/auth-flow';
import { buttonText, isDisabled, pressButton, typeText } from '@/features/shared/testing/native-ui';
import { queryWrapper } from '@/features/shared/testing/query-wrapper';

// The palette reads `Color` from expo-router; only the navigation is replaced.
jest.mock('expo-router', () => ({
  ...jest.requireActual<typeof import('expo-router')>('expo-router'),
  router: { push: jest.fn(), dismissTo: jest.fn() },
}));
jest.mock('@/features/auth/api/auth', () => ({
  requestSignInCode: jest.fn(),
  signInWithGoogleToken: jest.fn(),
  signInWithAppleToken: jest.fn(),
}));
jest.mock('@/features/auth/session', () => ({ startSession: jest.fn() }));
// The provider buttons are native (Google's own, Apple's own); stand-ins show where they go.
jest.mock('@/lib/google-sign-in', () => {
  const { Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    googleSignInAvailable: jest.fn(() => false),
    signInWithGoogle: jest.fn(),
    GoogleButton: ({ onPress }: { onPress: () => void }) => (
      <Pressable testID="google-button" onPress={onPress} />
    ),
  };
});
jest.mock('@/lib/apple-sign-in', () => {
  const { Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    appleSignInAvailable: jest.fn(async () => false),
    signInWithApple: jest.fn(),
    AppleButton: ({ onPress }: { onPress: () => void }) => (
      <Pressable testID="apple-button" onPress={onPress} />
    ),
  };
});

/**
 * The way in as it is shown: the address field and "Continue", the provider buttons only where
 * they are configured, and errors in words. Where each answer leads is in `useWelcome`'s tests.
 */

beforeEach(() => {
  jest.clearAllMocks();
  useAuthFlowStore.setState({ email: '', provider: null, purpose: { kind: 'sign-in' } });
});

async function renderScreen() {
  const Wrapper = queryWrapper();
  await render(
    <Wrapper>
      <WelcomeScreen footer={<Text>Jezik</Text>} />
    </Wrapper>
  );
}

test('greets, asks for an address, and places the footer under it', async () => {
  await renderScreen();

  expect(screen.getByRole('header', { name: 'Dobro došli' })).toBeOnTheScreen();
  expect(
    screen.getByText('Unesite email adresu i poslaćemo vam kod za prijavu.')
  ).toBeOnTheScreen();
  expect(screen.getByText('Email')).toBeOnTheScreen();
  expect(buttonText('welcome-continue')).toBe('Nastavi');
  expect(screen.getByText('Jezik')).toBeOnTheScreen();
  expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
});

test('without Google or Apple configured there are no provider buttons and no "or"', async () => {
  await renderScreen();

  await waitFor(() => expect(appleSignInAvailable).toHaveBeenCalled());
  expect(screen.queryByTestId('google-button')).not.toBeOnTheScreen();
  expect(screen.queryByTestId('apple-button')).not.toBeOnTheScreen();
  expect(screen.queryByText('ili')).not.toBeOnTheScreen();
});

test('each provider configured gets its button', async () => {
  jest.mocked(googleSignInAvailable).mockReturnValue(true);
  jest.mocked(appleSignInAvailable).mockResolvedValue(true);
  await renderScreen();

  expect(await screen.findByTestId('apple-button')).toBeOnTheScreen();
  expect(screen.getByTestId('google-button')).toBeOnTheScreen();
  expect(screen.getByText('ili')).toBeOnTheScreen();
});

test('an empty address is caught on the phone', async () => {
  await renderScreen();

  await pressButton('welcome-continue');

  expect(screen.getByText('Unesite email adresu.')).toBeOnTheScreen();
  expect(requestSignInCode).not.toHaveBeenCalled();
});

test('a malformed address is caught on the phone, and typing again clears the message', async () => {
  await renderScreen();

  await typeText('welcome-email', 'ana@');
  await pressButton('welcome-continue');

  expect(screen.getByText('Email adresa nije ispravna.')).toBeOnTheScreen();
  expect(requestSignInCode).not.toHaveBeenCalled();

  await typeText('welcome-email', 'ana@example.com');
  expect(screen.queryByText('Email adresa nije ispravna.')).not.toBeOnTheScreen();
});

test('while the address is checked the button waits and cannot be pressed twice', async () => {
  let answer: (value: Awaited<ReturnType<typeof requestSignInCode>>) => void = () => {};
  jest.mocked(requestSignInCode).mockReturnValueOnce(
    new Promise((resolve) => {
      answer = resolve;
    })
  );
  await renderScreen();

  await typeText('welcome-email', 'ana@example.com');
  await pressButton('welcome-continue');

  expect(buttonText('welcome-continue')).toBe('Sačekajte…');
  expect(isDisabled('welcome-continue')).toBe(true);
  await pressButton('welcome-continue');
  expect(requestSignInCode).toHaveBeenCalledTimes(1);

  answer({ message: 'Poslali smo kod.', data: { account_exists: true, retry_after: 30 } });
  await waitFor(() => expect(router.push).toHaveBeenCalledWith('/code'));
});

test('a server that cannot be reached is said in words, and the address stays', async () => {
  jest
    .mocked(requestSignInCode)
    .mockRejectedValueOnce(new ApiError(503, 'Servis trenutno nije dostupan.', 'req'));
  await renderScreen();

  await typeText('welcome-email', 'ana@example.com');
  await pressButton('welcome-continue');

  expect(screen.getByRole('alert')).toHaveTextContent('Servis trenutno nije dostupan.');
  expect(router.push).not.toHaveBeenCalled();
  expect(isDisabled('welcome-continue')).toBe(false);
});

test('the Google button starts Google', async () => {
  const { signInWithGoogle } =
    jest.requireMock<typeof import('@/lib/google-sign-in')>('@/lib/google-sign-in');
  jest.mocked(signInWithGoogle).mockResolvedValueOnce(null);
  jest.mocked(googleSignInAvailable).mockReturnValue(true);
  await renderScreen();

  await fireEvent.press(screen.getByTestId('google-button'));

  expect(signInWithGoogle).toHaveBeenCalled();
});
