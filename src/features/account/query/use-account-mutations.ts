import { useMutation } from '@tanstack/react-query';

import { updateAccount, type AccountChanges } from '@/features/shared/api/account';
import { useSessionStore } from '@/features/shared/stores/session';

/** Saving the profile: the answer is the account, which replaces the session's. */
export function useUpdateAccountMutation() {
  return useMutation({
    mutationFn: (changes: AccountChanges) => updateAccount(changes),
    onSuccess: ({ data }) => useSessionStore.getState().replaceUser(data),
  });
}
