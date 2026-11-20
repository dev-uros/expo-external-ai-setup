import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { fetchUserLogs } from '@/features/users/api/history';
import { useUserLogsQuery } from '@/features/users/query/use-user-history-queries';
import type { UserLog } from '@/features/users/schemas/history';

jest.mock('@/features/users/api/history', () => ({
  fetchUserLogs: jest.fn(),
  fetchUserLogins: jest.fn(),
}));

const fetchMock = fetchUserLogs as jest.MockedFunction<typeof fetchUserLogs>;

function log(id: number): UserLog {
  return {
    id,
    event: 'user.updated',
    old_values: null,
    new_values: null,
    actor: null,
    ip_address: null,
    created_at: '2026-11-20T10:00:00+00:00',
  };
}

function page(current: number, last: number, ids: number[]) {
  return {
    message: 'OK',
    data: ids.map(log),
    meta: { current_page: current, last_page: last, per_page: 25, total: 30 },
  };
}

function wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

test('pages load one after another into a single list, and stop at the last', async () => {
  fetchMock.mockResolvedValueOnce(page(1, 2, [3, 2])).mockResolvedValueOnce(page(2, 2, [1]));
  const { result } = await renderHook(() => useUserLogsQuery(7), { wrapper });

  await waitFor(() => expect(result.current.data?.map((entry) => entry.id)).toEqual([3, 2]));
  expect(result.current.hasNextPage).toBe(true);

  await act(() => result.current.fetchNextPage());

  expect(fetchMock).toHaveBeenLastCalledWith(7, 2);
  await waitFor(() => expect(result.current.data?.map((entry) => entry.id)).toEqual([3, 2, 1]));
  expect(result.current.hasNextPage).toBe(false);
});
