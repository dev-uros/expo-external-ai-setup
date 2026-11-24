import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ApiError } from '@/lib/http';
import {
  requestRegistrationCode,
  requestSignInCode,
  signInWithCode,
} from '@/features/auth/api/auth';
import { CodeScreen } from '@/features/auth/screens/code-screen';
import { startSession } from '@/features/auth/session';
import { useAuthFlowStore } from '@/features/auth/stores/auth-flow';
import { useToastStore } from '@/features/shared/stores/toast';
import { makeUser } from '@/features/shared/testing/fixtures';
import { buttonText, isDisabled, pressButton } from '@/features/shared/testing/native-ui';
import { queryWrapper } from '@/features/shared/testing/query-wrapper';

jest.mock('expo-router/stack', () => ({ Stack: { Title: () => null } }));
jest.mock('@/features/auth/api/auth', () => ({
  requestSignInCode: jest.fn(),
  requestRegistrationCode: jest.fn(),
  signInWithCode: jest.fn(),
  registerWithCode: jest.fn(),
}));
jest.mock('@/features/auth/session', () => ({ startSession: jest.fn() }));

/**
 * The code screen as it is shown: the address, the six boxes, and "send again" behind the
 * server's countdown (30 s). The code logic itself is in `useCodeForm`'s tests.
 */

const profile = {
  username: 'nova',
  first_name: null,
  last_name: null,
  display_personal_name: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: 1_000_000 });
  useToastStore.setState({ toast: null });
  useAuthFlowStore.getState().codeSent('ana@example.com', { kind: 'sign-in' }, 30);
});
afterEach(() => jest.useRealTimers());

async function renderScreen() {
  const Wrapper = queryWrapper();
  await render(
    <Wrapper>
      <CodeScreen />
    </Wrapper>
  );
}

async function wait(seconds: number) {
  await act(async () => {
    jest.advanceTimersByTime(seconds * 1000);
  });
}

test('says where the code went', async () => {
  await renderScreen();

  expect(screen.getByText('ana@example.com')).toBeOnTheScreen();
  expect(screen.getByLabelText('Kod iz email poruke')).toBeOnTheScreen();
  expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
});

test('"send again" waits out the countdown, second by second', async () => {
  await renderScreen();

  expect(buttonText('code-resend')).toBe('Novi kod za 30 sekundi');
  expect(isDisabled('code-resend')).toBe(true);

  await wait(9);
  expect(buttonText('code-resend')).toBe('Novi kod za 21 sekundu');

  await wait(19);
  expect(buttonText('code-resend')).toBe('Novi kod za 2 sekunde');
  expect(isDisabled('code-resend')).toBe(true);

  await wait(2);
  expect(buttonText('code-resend')).toBe('Pošalji kod ponovo');
  expect(isDisabled('code-resend')).toBe(false);
});

test('pressed during the countdown it asks for nothing', async () => {
  await renderScreen();

  await pressButton('code-resend');

  expect(requestSignInCode).not.toHaveBeenCalled();
});

test('after the countdown it mails a new code, says so, and starts counting again', async () => {
  jest.mocked(requestSignInCode).mockResolvedValueOnce({
    message: 'Poslali smo vam novi kod.',
    data: { account_exists: true, retry_after: 30 },
  });
  await renderScreen();
  await wait(30);

  await pressButton('code-resend');

  expect(requestSignInCode).toHaveBeenCalledWith('ana@example.com');
  expect(useToastStore.getState().toast?.message).toBe('Poslali smo vam novi kod.');
  expect(buttonText('code-resend')).toBe('Novi kod za 30 sekundi');
  expect(isDisabled('code-resend')).toBe(true);
});

test('a new code for a registration is asked for with the chosen username', async () => {
  jest
    .mocked(requestRegistrationCode)
    .mockResolvedValueOnce({ message: 'Poslato.', data: { retry_after: 30 } });
  useAuthFlowStore
    .getState()
    .codeSent('nova@example.com', { kind: 'register', profile, avatar: null }, 30);
  await renderScreen();
  await wait(30);

  await pressButton('code-resend');

  expect(requestRegistrationCode).toHaveBeenCalledWith('nova@example.com', 'nova');
});

test("asked too soon after all, it shows the server's wait instead", async () => {
  jest
    .mocked(requestSignInCode)
    .mockRejectedValueOnce(
      new ApiError(429, 'Novi kod možete zatražiti za 12 s.', 'req', undefined, 12)
    );
  await renderScreen();
  await wait(30);

  await pressButton('code-resend');

  expect(screen.getByRole('alert')).toHaveTextContent('Novi kod možete zatražiti za 12 s.');
  expect(buttonText('code-resend')).toBe('Novi kod za 12 sekundi');
});

test('the sixth digit signs in', async () => {
  jest
    .mocked(signInWithCode)
    .mockResolvedValueOnce({ message: 'OK', data: { token: 't', user: makeUser() } });
  await renderScreen();

  await fireEvent.changeText(screen.getByTestId('code-input'), '424242');

  expect(signInWithCode).toHaveBeenCalledWith('ana@example.com', '424242');
  expect(startSession).toHaveBeenCalledWith('t', makeUser());
});

test('a wrong code empties the boxes and says why', async () => {
  jest
    .mocked(signInWithCode)
    .mockRejectedValueOnce(
      new ApiError(422, 'Kod nije ispravan.', 'req', { code: ['Kod nije ispravan.'] })
    );
  await renderScreen();

  await fireEvent.changeText(screen.getByTestId('code-input'), '111111');

  expect(screen.getByRole('alert')).toHaveTextContent('Kod nije ispravan.');
  expect(screen.getByTestId('code-input')).toHaveProp('value', '');
});
