import { useMutation } from '@tanstack/react-query';

import { logout } from '@/features/auth/api/session';
import { endSession } from '@/features/auth/session';

/**
 * Signs out. The local session ends whether or not the server call succeeds: a user who asked
 * to sign out must not stay signed in because the network was down.
 */
export function useLogoutMutation() {
  return useMutation({
    mutationFn: logout,
    onSettled: () => endSession(),
  });
}
