import { useQuery } from '@tanstack/react-query';

import { fetchUsers } from '@/features/users/api/users';
import { usersKeys } from '@/features/users/query/keys';

/** Every account. Refetched when stale and the app returns to the foreground or the network. */
export function useUsersQuery() {
  return useQuery({
    queryKey: usersKeys.list(),
    queryFn: async () => (await fetchUsers()).data,
  });
}
