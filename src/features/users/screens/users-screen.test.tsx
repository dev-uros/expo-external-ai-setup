import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from '@testing-library/react-native';
import { Stack } from 'expo-router/stack';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { ApiError } from '@/lib/http';
import { fetchUsers } from '@/features/users/api/users';
import { usersKeys } from '@/features/users/query/keys';
import { UsersScreen } from '@/features/users/screens/users-screen';
import { ana, marko, nikola } from '@/features/users/testing/fixtures';

/**
 * The list's four states. Typing into the native search bar happens in the header, out of
 * Jest's reach — the matching itself is `filterUsers`' test, the typing is the Maestro flow's.
 */

jest.mock('@/features/users/api/users', () => ({ fetchUsers: jest.fn(), fetchUser: jest.fn() }));

const fetchUsersMock = fetchUsers as jest.MockedFunction<typeof fetchUsers>;

let client: QueryClient;

async function renderUsers() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await renderRouter({
    _layout: () => <Stack />,
    index: () => (
      <QueryClientProvider client={client}>
        <UsersScreen />
      </QueryClientProvider>
    ),
  });
}

beforeEach(() => fetchUsersMock.mockReset());

test('loading first, then everyone with their status', async () => {
  fetchUsersMock.mockResolvedValueOnce({ message: 'OK', data: [ana, marko, nikola] });

  await renderUsers();
  expect(screen.getByLabelText('Učitavanje korisnika')).toBeOnTheScreen();

  expect(
    await screen.findByRole('link', { name: 'Ana Nikolić, ana@firma.com, Aktivan' })
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('link', { name: 'Marko Petrović, marko@firma.com, Nije aktiviran' })
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('link', { name: 'Nikola Ilić, nikola@firma.com, Isključen' })
  ).toBeOnTheScreen();
});

test('nobody yet is said in words, not shown as a blank list', async () => {
  fetchUsersMock.mockResolvedValueOnce({ message: 'OK', data: [] });

  await renderUsers();

  expect(await screen.findByText('Još nema korisnika')).toBeOnTheScreen();
});

test('a failed first load explains itself and retries on request', async () => {
  fetchUsersMock.mockRejectedValueOnce(new ApiError(500, 'Server je nedostupan.', 'r'));
  fetchUsersMock.mockResolvedValueOnce({ message: 'OK', data: [ana] });

  await renderUsers();

  expect(await screen.findByText('Korisnici nisu učitani')).toBeOnTheScreen();
  expect(screen.getByText('Server je nedostupan.')).toBeOnTheScreen();

  await fireEvent.press(screen.getByTestId('users-load-error-action'));

  expect(await screen.findByText('Ana Nikolić')).toBeOnTheScreen();
  expect(screen.queryByText('Korisnici nisu učitani')).not.toBeOnTheScreen();
});

test('a failed refresh keeps the list and says so above it', async () => {
  fetchUsersMock.mockResolvedValueOnce({ message: 'OK', data: [ana, marko] });
  await renderUsers();
  expect(await screen.findByText('Ana Nikolić')).toBeOnTheScreen();

  fetchUsersMock.mockRejectedValueOnce(new ApiError(503, 'Održavanje u toku.', 'r'));
  await act(() => client.refetchQueries({ queryKey: usersKeys.list() }));

  expect(await screen.findByText('Osvežavanje nije uspelo: Održavanje u toku.')).toBeOnTheScreen();
  expect(screen.getByText('Ana Nikolić')).toBeOnTheScreen();
  expect(screen.getByText('Marko Petrović')).toBeOnTheScreen();
});
