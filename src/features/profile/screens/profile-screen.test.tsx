import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router/stack';
import { renderRouter, screen } from 'expo-router/testing-library';

import { ProfileScreen } from '@/features/profile/screens/profile-screen';
import type { User } from '@/features/shared/schemas/user';
import { useSessionStore } from '@/features/shared/stores/session';

/**
 * What the profile shows. The sign-out confirmation is covered by `useSignOut`'s tests; the
 * native button itself by the Maestro flow.
 */

const user: User = {
  id: 1,
  name: 'Uroš',
  surname: 'Minić',
  email: 'uros@firma.com',
  role: 'admin',
  avatar_url: null,
  deactivated_at: null,
  email_verified_at: '2026-01-01T10:00:00+00:00',
  created_at: '2026-01-01T10:00:00+00:00',
  updated_at: '2026-01-01T10:00:00+00:00',
};

async function renderProfile(overrides: Partial<User> = {}) {
  useSessionStore.setState({ status: 'signedIn', user: { ...user, ...overrides } });
  const client = new QueryClient();
  await renderRouter({
    _layout: () => <Stack />,
    index: () => (
      <QueryClientProvider client={client}>
        <ProfileScreen />
      </QueryClientProvider>
    ),
  });
}

test('shows the name and the role in Serbian', async () => {
  await renderProfile();

  expect(screen.getByRole('header', { name: 'Uroš Minić' })).toBeOnTheScreen();
  expect(screen.getByText('Administrator')).toBeOnTheScreen();
});

test('a user without a picture gets their initials', async () => {
  await renderProfile({ avatar_url: null, role: 'user' });

  expect(screen.getByText('UM')).toBeOnTheScreen();
  expect(screen.getByText('Korisnik')).toBeOnTheScreen();
});

test('a user with a picture gets the picture, not initials', async () => {
  await renderProfile({ avatar_url: 'https://api.test/storage/avatars/a.webp' });

  expect(screen.queryByText('UM')).not.toBeOnTheScreen();
  expect(screen.getByLabelText('Uroš Minić', { exact: true })).toBeOnTheScreen();
});

test('shows the email, so an edit to it is visible', async () => {
  await renderProfile();

  expect(screen.getByText('uros@firma.com')).toBeOnTheScreen();
});
