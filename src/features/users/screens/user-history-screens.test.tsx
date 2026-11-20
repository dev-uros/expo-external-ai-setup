import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router/stack';
import { renderRouter, screen } from 'expo-router/testing-library';

import { ApiError } from '@/lib/http';
import { fetchUserLogins, fetchUserLogs } from '@/features/users/api/history';
import { fetchUser } from '@/features/users/api/users';
import { UserLoginsScreen, UserLogsScreen } from '@/features/users/screens/user-history-screens';
import { makeUser } from '@/features/users/testing/fixtures';

jest.mock('@/features/users/api/history', () => ({
  fetchUserLogs: jest.fn(),
  fetchUserLogins: jest.fn(),
}));
jest.mock('@/features/users/api/users', () => ({ fetchUser: jest.fn() }));

const meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 };

async function renderScreen(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await renderRouter({
    _layout: () => <Stack />,
    index: () => <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (fetchUser as jest.Mock).mockResolvedValue({
    message: 'OK',
    data: makeUser({ id: 2, name: 'Milica', surname: 'Jovanović' }),
  });
});

test('a change reads as an event, who did it, and what changed', async () => {
  (fetchUserLogs as jest.Mock).mockResolvedValueOnce({
    message: 'OK',
    meta,
    data: [
      {
        id: 1,
        event: 'user.role_changed',
        old_values: { role: 'user' },
        new_values: { role: 'admin' },
        actor: { id: 1, name: 'Uroš', surname: 'Minić', email: 'uros@firma.com' },
        ip_address: '10.0.0.1',
        created_at: '2026-11-20T10:00:00+00:00',
      },
    ],
  });

  await renderScreen(<UserLogsScreen id={2} />);

  expect(await screen.findByText('Uloga promenjena')).toBeOnTheScreen();
  expect(screen.getByLabelText('Uloga: Korisnik u Administrator')).toBeOnTheScreen();
  expect(screen.getByText('Uroš Minić · 10.0.0.1')).toBeOnTheScreen();
  expect(await screen.findByText('Milica Jovanović')).toBeOnTheScreen();
});

test('what the system did is attributed to the system', async () => {
  (fetchUserLogs as jest.Mock).mockResolvedValueOnce({
    message: 'OK',
    meta,
    data: [
      {
        id: 1,
        event: 'user.created',
        old_values: null,
        new_values: { name: 'Milica' },
        actor: null,
        ip_address: null,
        created_at: '2026-11-20T10:00:00+00:00',
      },
    ],
  });

  await renderScreen(<UserLogsScreen id={2} />);

  expect(await screen.findByText('Nalog kreiran')).toBeOnTheScreen();
  expect(screen.getByText('Sistem')).toBeOnTheScreen();
});

test('a sign-in attempt shows how it ended, from where and on what', async () => {
  (fetchUserLogins as jest.Mock).mockResolvedValueOnce({
    message: 'OK',
    meta,
    data: [
      {
        id: 1,
        outcome: 'invalid_credentials',
        email: 'milica@firma.com',
        ip_address: '10.0.0.2',
        user_agent: 'Backoffice/1 CFNetwork Darwin/27.2.0',
        created_at: '2026-11-20T10:00:00+00:00',
      },
    ],
  });

  await renderScreen(<UserLoginsScreen id={2} />);

  expect(await screen.findByText('Pogrešni podaci')).toBeOnTheScreen();
  expect(screen.getByText('10.0.0.2')).toBeOnTheScreen();
  expect(screen.getByText('Backoffice/1 CFNetwork Darwin/27.2.0')).toBeOnTheScreen();
});

test('no entries yet is said in words', async () => {
  (fetchUserLogins as jest.Mock).mockResolvedValueOnce({ message: 'OK', meta, data: [] });

  await renderScreen(<UserLoginsScreen id={2} />);

  expect(await screen.findByText('Još nema zapisa')).toBeOnTheScreen();
});

test('a plain user is refused by the server, and the refusal is shown', async () => {
  (fetchUserLogs as jest.Mock).mockRejectedValueOnce(
    new ApiError(403, 'This action is unauthorized.', 'r')
  );

  await renderScreen(<UserLogsScreen id={2} />);

  expect(await screen.findByText('Istorija izmena nije učitana')).toBeOnTheScreen();
  expect(screen.getByText('This action is unauthorized.')).toBeOnTheScreen();
});

test('a link without a usable id asks nobody', async () => {
  await renderScreen(<UserLogsScreen id={null} />);

  expect(screen.getByText('Korisnik ne postoji')).toBeOnTheScreen();
  expect(fetchUserLogs).not.toHaveBeenCalled();
});
