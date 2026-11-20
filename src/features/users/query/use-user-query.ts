import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { User } from '@/features/shared/schemas/user';
import { useSessionStore } from '@/features/shared/stores/session';
import { fetchUser } from '@/features/users/api/users';
import { usersKeys } from '@/features/users/query/keys';

/**
 * One account. What the app already knows is shown at once as placeholder data while the detail
 * request runs — the row from the list, or the session for one's own account — so opening a user
 * never shows a spinner when there is something to show.
 */
export function useUserQuery(id: number) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: async () => (await fetchUser(id)).data,
    placeholderData: () => {
      const fromList = queryClient
        .getQueryData<User[]>(usersKeys.list())
        ?.find((user) => user.id === id);
      if (fromList) return fromList;
      const own = useSessionStore.getState().user;
      return own?.id === id ? own : undefined;
    },
  });
}
