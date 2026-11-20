import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { PropsWithChildren } from 'react';

import { ApiError } from '@/lib/http';
import type { User } from '@/features/shared/schemas/user';
import { useSessionStore } from '@/features/shared/stores/session';
import { useToastStore } from '@/features/shared/stores/toast';
import {
  changeUserRole,
  deactivateUser,
  reactivateUser,
  resendActivation,
} from '@/features/users/api/users';
import { useUserActions } from '@/features/users/hooks/use-user-actions';
import { makeUser } from '@/features/users/testing/fixtures';

jest.mock('@/features/users/api/users', () => ({
  changeUserRole: jest.fn(),
  deactivateUser: jest.fn(),
  reactivateUser: jest.fn(),
  resendActivation: jest.fn(),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const admin = makeUser({ id: 1, name: 'Uroš', surname: 'Minić', role: 'admin' });
const marko = makeUser({ id: 2, name: 'Marko', surname: 'Marić', email_verified_at: null });

function wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

async function renderActions(user: User, viewer: User = admin) {
  useSessionStore.setState({ status: 'signedIn', user: viewer });
  const { result } = await renderHook(() => useUserActions(user), { wrapper });
  return result;
}

beforeEach(() => {
  jest.clearAllMocks();
  useToastStore.setState({ toast: null });
});

test('offers what the rules allow for this viewer', async () => {
  expect((await renderActions(marko)).current.actions).toEqual([
    'edit',
    'changeRole',
    'resendActivation',
    'deactivate',
  ]);
  expect((await renderActions(marko, { ...marko, id: 9 })).current.actions).toEqual([]);
});

test('editing opens the form for this account, without asking', async () => {
  const actions = await renderActions(marko);

  await act(() => actions.current.choose('edit'));

  expect(router.push).toHaveBeenCalledWith({ pathname: '/user-form/[id]', params: { id: '2' } });
  expect(actions.current.confirming).toBeNull();
});

test('every other action asks first, and cancelling does nothing', async () => {
  const actions = await renderActions(marko);

  await act(() => actions.current.choose('deactivate'));
  expect(actions.current.confirming).toBe('deactivate');

  await act(() => actions.current.cancel());
  expect(actions.current.confirming).toBeNull();
  expect(deactivateUser).not.toHaveBeenCalled();
});

test.each([
  ['deactivate', deactivateUser, 2, 'Nalog je isključen.'],
  ['reactivate', reactivateUser, 2, 'Nalog je ponovo uključen.'],
  ['resendActivation', resendActivation, 2, 'Aktivacioni email je ponovo poslat.'],
] as const)(
  'confirming %s calls the API and shows its message',
  async (action, api, id, message) => {
    (api as jest.Mock).mockResolvedValueOnce({ message, data: marko });
    const actions = await renderActions(marko);

    await act(() => actions.current.choose(action));
    await act(() => actions.current.confirm());

    expect(api).toHaveBeenCalledWith(id);
    await waitFor(() => expect(useToastStore.getState().toast?.message).toBe(message));
  }
);

test('changing the role gives the other one', async () => {
  (changeUserRole as jest.Mock).mockResolvedValueOnce({
    message: 'Uloga korisnika je uspešno promenjena.',
    data: { ...marko, role: 'admin' },
  });
  const actions = await renderActions(marko);

  await act(() => actions.current.choose('changeRole'));
  await act(() => actions.current.confirm());

  expect(changeUserRole).toHaveBeenCalledWith(2, 'admin');
});

test('a refusal stays on screen as it arrived, until the next attempt', async () => {
  (deactivateUser as jest.Mock).mockRejectedValueOnce(
    new ApiError(403, 'Ne možete isključiti sopstveni nalog.', 'r')
  );
  const actions = await renderActions(marko);

  await act(() => actions.current.choose('deactivate'));
  await act(() => actions.current.confirm());

  await waitFor(() => expect(actions.current.error).toBe('Ne možete isključiti sopstveni nalog.'));
  expect(useToastStore.getState().toast).toBeNull();

  await act(() => actions.current.choose('deactivate'));
  expect(actions.current.error).toBeNull();
});
