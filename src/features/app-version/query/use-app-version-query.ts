import { useQuery } from '@tanstack/react-query';

import { fetchAppVersionPolicy } from '@/features/app-version/api/app-version';

export const appVersionKeys = {
  policy: () => ['app-version', 'policy'] as const,
};

/**
 * The server's minimum version. Never fresh for long: asked again every time the app returns to
 * the foreground, so raising the minimum reaches phones that were left open.
 *
 * It belongs to the app, not to whoever is signed in, so signing out keeps it (`keepOnSignOut`,
 * read by `endSession`). Wiping it would also strand the gate: a launch without a stored token
 * signs out while this request is still in flight.
 */
export function useAppVersionPolicyQuery() {
  return useQuery({
    queryKey: appVersionKeys.policy(),
    queryFn: async () => (await fetchAppVersionPolicy()).data,
    staleTime: 0,
    meta: { keepOnSignOut: true },
  });
}
