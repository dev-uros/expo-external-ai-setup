import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { appleSignInAvailable, signInWithApple } from '@/lib/apple-sign-in';
import { deleteAccount } from '@/features/account/api/account';
import { useSessionStore } from '@/features/shared/stores/session';
import { useToastStore } from '@/features/shared/stores/toast';
import { toDisplayMessage } from '@/features/shared/utils/api-errors';

/**
 * Deleting the account, behind a confirmation — App Store and Google Play both require that it
 * can be done in the app.
 *
 * An Apple-linked account first asks Apple once more, for a fresh authorization code the server
 * uses to revoke the app's Apple authorisation (App Review requires that too). Backing out of
 * Apple's sheet does not stop the deletion — the person already confirmed it.
 *
 * `onDeleted` ends the session; the route passes it in, because the session is the auth
 * feature's.
 */
export function useDeleteAccount(onDeleted: () => Promise<void>) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useMutation({
    mutationFn: async () => {
      const user = useSessionStore.getState().user;
      const code =
        user?.has_apple && (await appleSignInAvailable())
          ? ((await signInWithApple().catch(() => null))?.authorizationCode ?? null)
          : null;
      return deleteAccount(code);
    },
    onSuccess: async ({ message }) => {
      useToastStore.getState().show(message);
      await onDeleted();
    },
    onError: (failure) => setError(toDisplayMessage(failure)),
  });

  return {
    confirming,
    isPending: remove.isPending,
    error,
    request: () => {
      if (!remove.isPending) {
        setError(null);
        setConfirming(true);
      }
    },
    cancel: () => setConfirming(false),
    confirm: () => {
      setConfirming(false);
      remove.mutate();
    },
  };
}
