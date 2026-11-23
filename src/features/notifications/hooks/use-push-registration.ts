import { useEffect } from 'react';

import { useSyncPushMutation } from '@/features/notifications/query/use-notifications-queries';
import { shouldAskAutomatically } from '@/features/notifications/sync';

/**
 * Registers this phone for the session — once per signed-in mount, which is every launch with a
 * stored token and every sign-in. The first time on this install it also asks for permission, so
 * the prompt appears right after signing in. Mounted by the signed-in layout. A failure is quiet:
 * the profile's notifications section shows the state and offers to try again.
 */
export function usePushRegistration() {
  const { mutate } = useSyncPushMutation();

  useEffect(() => {
    mutate({ prompt: shouldAskAutomatically() });
  }, [mutate]);
}
