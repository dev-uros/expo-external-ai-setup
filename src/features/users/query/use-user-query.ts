import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { User } from '@/features/shared/schemas/user';
import { fetchUser } from '@/features/users/api/users';
import { usersKeys } from '@/features/users/query/keys';

/**
 * One account. When the list already holds it, that row is shown at once as placeholder data
 * while the detail request runs — opening a user from the list never shows a spinner.
 */
export function useUserQuery(id: number) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: async () => (await fetchUser(id)).data,
    placeholderData: () =>
      queryClient.getQueryData<User[]>(usersKeys.list())?.find((user) => user.id === id),
  });
}
