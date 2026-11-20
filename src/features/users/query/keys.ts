import { usersRoot } from '@/features/shared/query/keys';

/**
 * Query keys for the users feature, in one place. They nest under one root, so a write that
 * changes an account invalidates the list, every detail and both histories with one prefix.
 */
export const usersKeys = {
  root: usersRoot,
  list: () => [...usersRoot, 'list'] as const,
  detail: (id: number) => [...usersRoot, 'detail', id] as const,
  logs: (id: number) => [...usersRoot, 'detail', id, 'logs'] as const,
  logins: (id: number) => [...usersRoot, 'detail', id, 'logins'] as const,
};
