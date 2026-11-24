import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { act, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Alert, Text, type AlertButton } from 'react-native';

import { ApiError, request } from '@/lib/http';
import { EditProfileScreen } from '@/features/account/screens/edit-profile-screen';
import { useSessionStore } from '@/features/shared/stores/session';
import { useToastStore } from '@/features/shared/stores/toast';
import { makeUser } from '@/features/shared/testing/fixtures';
import {
  buttonText,
  isDisabled,
  isSwitchOn,
  pressButton,
  setSwitch,
  typeText,
} from '@/features/shared/testing/native-ui';
import { queryWrapper } from '@/features/shared/testing/query-wrapper';

jest.mock('@/lib/http', () => ({ ...jest.requireActual('@/lib/http'), request: jest.fn() }));
const requestMock = jest.mocked(request);
const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

/**
 * The profile form as a modal over Settings: what it starts with, when Save is offered, what a
 * save does, and that leaving with unsaved changes asks first. What is sent is in
 * `useEditProfileForm`'s tests.
 */

const user = makeUser({ username: 'ana', first_name: 'Ana', last_name: null });

beforeEach(() => {
  requestMock.mockReset();
  alertSpy.mockClear();
  useToastStore.setState({ toast: null });
  useSessionStore.setState({ status: 'signedIn', user });
});

async function openForm() {
  const Wrapper = queryWrapper();
  await renderRouter(
    {
      _layout: () => (
        <Wrapper>
          <Stack />
        </Wrapper>
      ),
      index: () => <Text>Podešavanja</Text>,
      'edit-profile': () => <EditProfileScreen />,
    },
    { initialUrl: '/' }
  );
  await act(() => router.push('/edit-profile'));
}

function lastAlert() {
  const [title, message, buttons] = alertSpy.mock.calls.at(-1)!;
  return { title, message, buttons: buttons as AlertButton[] };
}

test('starts from the account, with nothing to save yet', async () => {
  await openForm();

  expect(screen.getByText('Korisničko ime')).toBeOnTheScreen();
  expect(screen.getByText('Ime (opciono)')).toBeOnTheScreen();
  expect(screen.getByText('Prezime (opciono)')).toBeOnTheScreen();
  expect(isSwitchOn('profile-display-name')).toBe(false);
  expect(buttonText('profile-save')).toBe('Sačuvaj');
  expect(isDisabled('profile-save')).toBe(true);
});

test('a change offers Save; changing it back takes the offer away', async () => {
  await openForm();

  await setSwitch('profile-display-name', true);
  expect(isSwitchOn('profile-display-name')).toBe(true);
  expect(isDisabled('profile-save')).toBe(false);

  await setSwitch('profile-display-name', false);
  expect(isDisabled('profile-save')).toBe(true);
});

test('saving closes the form, says so, and the session holds the new account', async () => {
  const saved = makeUser({ username: 'ana', first_name: 'Ana', display_personal_name: true });
  requestMock.mockResolvedValueOnce({ message: 'Profil je sačuvan.', data: saved });
  await openForm();

  await setSwitch('profile-display-name', true);
  await pressButton('profile-save');

  await waitFor(() => expect(screen).toHavePathname('/'));
  expect(useToastStore.getState().toast?.message).toBe('Profil je sačuvan.');
  expect(useSessionStore.getState().user).toEqual(saved);
  expect(alertSpy).not.toHaveBeenCalled();
});

test('a username already taken stays on the form, under its field', async () => {
  requestMock.mockRejectedValueOnce(
    new ApiError(422, 'Korisničko ime je zauzeto.', 'req', {
      username: ['Korisničko ime je zauzeto.'],
    })
  );
  await openForm();

  await typeText('profile-username', 'marko');
  await pressButton('profile-save');

  expect(await screen.findByText('Korisničko ime je zauzeto.')).toBeOnTheScreen();
  expect(screen).toHavePathname('/edit-profile');
});

test('leaving with nothing changed just leaves', async () => {
  await openForm();

  await act(() => router.back());

  expect(screen).toHavePathname('/');
  expect(alertSpy).not.toHaveBeenCalled();
});

test('leaving with unsaved changes asks; "keep editing" stays, "discard" leaves', async () => {
  await openForm();
  await typeText('profile-first-name', 'Anica');

  await act(() => router.back());

  expect(lastAlert().title).toBe('Odbaciti izmene?');
  expect(lastAlert().message).toBe('Izmene koje niste sačuvali biće izgubljene.');
  expect(screen).toHavePathname('/edit-profile');

  const [keepEditing] = lastAlert().buttons;
  expect(keepEditing?.text).toBe('Nastavi izmenu');
  await act(() => keepEditing?.onPress?.());
  expect(screen).toHavePathname('/edit-profile');

  await act(() => router.back());
  expect(lastAlert().buttons[1]?.text).toBe('Odbaci');
  await act(() => lastAlert().buttons[1]?.onPress?.());

  await waitFor(() => expect(screen).toHavePathname('/'));
  expect(requestMock).not.toHaveBeenCalled();
  expect(useSessionStore.getState().user).toEqual(user);
});
