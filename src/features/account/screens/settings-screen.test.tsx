import { Stack } from 'expo-router/stack';
import { renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { SettingsScreen } from '@/features/account/screens/settings-screen';
import type { User } from '@/features/shared/schemas/user';
import { useSessionStore } from '@/features/shared/stores/session';
import { makeUser } from '@/features/shared/testing/fixtures';
import { queryWrapper } from '@/features/shared/testing/query-wrapper';

jest.mock('expo-image-picker', () => ({}));

/**
 * The account card at the top of Settings, and the sections the route puts under it. Changing the
 * picture is covered by `useAvatarEditor`'s tests, each section by its own.
 */

async function renderSettings(overrides: Partial<User> = {}) {
  useSessionStore.setState({ status: 'signedIn', user: makeUser(overrides) });
  const Wrapper = queryWrapper();
  await renderRouter({
    _layout: () => <Stack />,
    index: () => (
      <Wrapper>
        <SettingsScreen footer={<Text>Odeljci podešavanja</Text>} />
      </Wrapper>
    ),
  });
}

test('with a name, the name leads and the username follows with an @ — "show my name" or not', async () => {
  // The card is the account itself; "show my name" decides only how others and the greeting see it.
  await renderSettings({ display_personal_name: false, first_name: 'Ana', last_name: 'Anić' });

  expect(screen.getByRole('header', { name: 'Ana Anić' })).toBeOnTheScreen();
  expect(screen.getByText('@ana')).toBeOnTheScreen();
  expect(screen.getByText('ana@example.com')).toBeOnTheScreen();
});

test('a first name alone is enough', async () => {
  await renderSettings({ first_name: 'Ana', last_name: null });

  expect(screen.getByRole('header', { name: 'Ana' })).toBeOnTheScreen();
});

test('without a name the username leads, once', async () => {
  await renderSettings({ first_name: null, last_name: null });

  expect(screen.getByRole('header', { name: 'ana' })).toBeOnTheScreen();
  expect(screen.queryByText('@ana')).not.toBeOnTheScreen();
});

test('the sections the route passes in come under the card', async () => {
  await renderSettings();

  expect(screen.getByText('Odeljci podešavanja')).toBeOnTheScreen();
});

test('signed out (the moment the session ends) it shows no card rather than failing', async () => {
  useSessionStore.setState({ status: 'signedOut', user: null });
  const Wrapper = queryWrapper();
  await renderRouter({
    _layout: () => <Stack />,
    index: () => (
      <Wrapper>
        <SettingsScreen />
      </Wrapper>
    ),
  });

  expect(screen.queryByText('ana@example.com')).not.toBeOnTheScreen();
});
