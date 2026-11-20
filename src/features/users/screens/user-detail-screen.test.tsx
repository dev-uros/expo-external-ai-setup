import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router/stack';
import { renderRouter, screen } from 'expo-router/testing-library';

import { ApiError } from '@/lib/http';
import { fetchUser } from '@/features/users/api/users';
import { usersKeys } from '@/features/users/query/keys';
import { UserDetailScreen } from '@/features/users/screens/user-detail-screen';
import { ana, nikola } from '@/features/users/testing/fixtures';

jest.mock('@/features/users/api/users', () => ({ fetchUsers: jest.fn(), fetchUser: jest.fn() }));

const fetchUserMock = fetchUser as jest.MockedFunction<typeof fetchUser>;

async function renderDetail(id: number | null, client = new QueryClient()) {
  client.setDefaultOptions({ queries: { retry: false } });
  await renderRouter({
    _layout: () => <Stack />,
    index: () => (
      <QueryClientProvider client={client}>
        <UserDetailScreen id={id} />
      </QueryClientProvider>
    ),
  });
}

beforeEach(() => fetchUserMock.mockReset());

test('shows the account: name, status, email, role and dates in Serbian', async () => {
  fetchUserMock.mockResolvedValueOnce({ message: 'OK', data: ana });

  await renderDetail(1);

  expect(await screen.findByRole('header', { name: 'Ana Nikolić' })).toBeOnTheScreen();
  expect(screen.getByText('Aktivan')).toBeOnTheScreen();
  expect(screen.getByLabelText('Email: ana@firma.com')).toBeOnTheScreen();
  expect(screen.getByLabelText('Uloga: Administrator')).toBeOnTheScreen();
  expect(screen.getByLabelText(/^Kreiran: 1\. januar 2026/)).toBeOnTheScreen();
  expect(screen.queryByLabelText(/^Isključen:/)).not.toBeOnTheScreen();
  expect(fetchUserMock).toHaveBeenCalledWith(1);
});

test('a deactivated account says when it was switched off', async () => {
  fetchUserMock.mockResolvedValueOnce({ message: 'OK', data: nikola });

  await renderDetail(3);

  expect(await screen.findByRole('header', { name: 'Nikola Ilić' })).toBeOnTheScreen();
  expect(screen.getAllByText('Isključen')).toHaveLength(2); // the badge and the date's label
  expect(screen.getByLabelText(/^Isključen: 1\. mart 2026/)).toBeOnTheScreen();
});

test('opened from the list, the row is shown at once while the detail loads', async () => {
  fetchUserMock.mockReturnValueOnce(new Promise(() => {}));
  const client = new QueryClient();
  client.setQueryData(usersKeys.list(), [ana, nikola]);

  await renderDetail(3, client);

  expect(screen.getByRole('header', { name: 'Nikola Ilić' })).toBeOnTheScreen();
  expect(screen.queryByLabelText('Učitavanje korisnika')).not.toBeOnTheScreen();
});

test('an id that does not exist is "no such user", not an error', async () => {
  fetchUserMock.mockRejectedValueOnce(new ApiError(404, 'Korisnik nije pronađen.', 'r'));

  await renderDetail(999);

  expect(await screen.findByText('Korisnik ne postoji')).toBeOnTheScreen();
});

test('a link without a usable id says the same, without asking the server', async () => {
  await renderDetail(null);

  expect(screen.getByText('Korisnik ne postoji')).toBeOnTheScreen();
  expect(fetchUserMock).not.toHaveBeenCalled();
});

test('any other failure offers to try again', async () => {
  fetchUserMock.mockRejectedValueOnce(new ApiError(500, 'Server je nedostupan.', 'r'));

  await renderDetail(1);

  expect(await screen.findByText('Korisnik nije učitan')).toBeOnTheScreen();
  expect(screen.getByTestId('user-load-error-action')).toBeOnTheScreen();
});
