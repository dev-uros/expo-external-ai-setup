import { usersRoot } from '@/features/shared/query/keys';

/**
 * Query keys for the users feature, in one place. They nest under one root, so a write that
 * changes an account invalidates the list and every detail with a single prefix match.
 */
export const usersKeys = {
  root: usersRoot,
  list: () => [...usersRoot, 'list'] as const,
  detail: (id: number) => [...usersRoot, 'detail', id] as const,
};
