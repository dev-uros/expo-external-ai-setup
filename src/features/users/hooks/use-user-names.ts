import { fullName } from '@/features/shared/utils/user';
import { useUsersQuery } from '@/features/users/query/use-users-query';

/**
 * Names people by id, from the users list — for screens elsewhere that mention someone (the home
 * screen's shortcuts). Backed by the query, so the names fill in by themselves once it lands.
 */
export function useUserNames(): (id: number) => string | undefined {
  const { data: users } = useUsersQuery();
  return (id) => {
    const user = users?.find((candidate) => candidate.id === id);
    return user ? fullName(user) : undefined;
  };
}
