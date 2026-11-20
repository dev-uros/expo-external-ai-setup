import { useState } from 'react';

import { useLogoutMutation } from '@/features/auth/query/use-logout-mutation';

/**
 * Sign-out behind a confirmation. `confirming` drives the platform dialog
 * (`SignOutConfirmation`); every way of closing it other than confirming — Cancel, the Android
 * back button or gesture, a tap outside — goes through `cancel` and leaves the user signed in.
 */
export function useSignOut() {
  const logout = useLogoutMutation();
  const [confirming, setConfirming] = useState(false);

  return {
    confirming,
    isPending: logout.isPending,
    requestSignOut: () => {
      if (!logout.isPending) setConfirming(true);
    },
    cancel: () => setConfirming(false),
    confirm: () => {
      setConfirming(false);
      logout.mutate();
    },
  };
}
