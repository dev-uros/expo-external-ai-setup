import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { readPushPermission } from '@/lib/notifications';
import { currentDevice, sendTestPush } from '@/features/shared/api/device';
import { notificationsKeys } from '@/features/notifications/query/keys';
import { syncPushRegistration } from '@/features/notifications/sync';

/** The phone this session is on, as the server last recorded it. */
export function useCurrentDeviceQuery() {
  return useQuery({
    queryKey: notificationsKeys.device(),
    queryFn: async () => (await currentDevice()).data,
  });
}

/**
 * Registers the phone and its push token; the answer replaces the cached device, and the permission
 * it saw is kept beside it so the profile does not have to ask the system again.
 */
export function useSyncPushMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncPushRegistration,
    onSuccess: ({ device, permission }) => {
      queryClient.setQueryData(notificationsKeys.device(), device);
      queryClient.setQueryData(notificationsKeys.permission(), permission);
    },
  });
}

/**
 * The system's notification permission. Not server state, but read asynchronously and shared by the
 * signed-in layout (which may have just asked) and the profile — the query cache is the one place
 * both see. Never stale on its own; the profile refreshes it when the app returns to the foreground.
 */
export function usePushPermissionQuery() {
  return useQuery({
    queryKey: notificationsKeys.permission(),
    queryFn: readPushPermission,
    staleTime: Infinity,
  });
}

export function useTestPushMutation() {
  return useMutation({ mutationFn: sendTestPush });
}
