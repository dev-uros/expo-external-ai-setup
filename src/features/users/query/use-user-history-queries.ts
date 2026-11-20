import { useInfiniteQuery } from '@tanstack/react-query';

import { nextPage } from '@/features/shared/schemas/api';
import { fetchUserLogins, fetchUserLogs } from '@/features/users/api/history';
import { usersKeys } from '@/features/users/query/keys';

/**
 * The audit trails as infinite lists: the next page of 25 is fetched as the user scrolls to the
 * end, where the web shows page numbers. `pages` flattens them for the list.
 */

export function useUserLogsQuery(id: number) {
  return useInfiniteQuery({
    queryKey: usersKeys.logs(id),
    queryFn: ({ pageParam }) => fetchUserLogs(id, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => nextPage(last.meta),
    select: (data) => data.pages.flatMap((page) => page.data),
  });
}

export function useUserLoginsQuery(id: number) {
  return useInfiniteQuery({
    queryKey: usersKeys.logins(id),
    queryFn: ({ pageParam }) => fetchUserLogins(id, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => nextPage(last.meta),
    select: (data) => data.pages.flatMap((page) => page.data),
  });
}
