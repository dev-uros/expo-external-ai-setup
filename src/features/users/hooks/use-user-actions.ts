import { router } from 'expo-router';
import { useState } from 'react';

import type { User } from '@/features/shared/schemas/user';
import { useSessionStore } from '@/features/shared/stores/session';
import { useToastStore } from '@/features/shared/stores/toast';
import { toDisplayMessage } from '@/features/shared/utils/api-errors';
import {
  useChangeRoleMutation,
  useDeactivateUserMutation,
  useReactivateUserMutation,
  useResendActivationMutation,
} from '@/features/users/query/use-user-mutations';
import {
  availableActions,
  type UserAction,
  type Viewer,
} from '@/features/users/utils/user-actions';

/** The actions that ask before they act — all of them except opening the edit form. */
export type ConfirmableAction = Exclude<UserAction, 'edit'>;

/** The role a role change would give: with two roles, the other one. */
export function otherRole(user: User) {
  return user.role === 'admin' ? 'user' : 'admin';
}

export function useViewer(): Viewer {
  const viewer = useSessionStore((state) => state.user);
  return { id: viewer?.id, isAdmin: viewer?.role === 'admin' };
}

/**
 * The account's admin actions: which are offered, the confirmation each asks for, and running
 * it. The backend's message becomes a toast; a refusal stays on screen as `error` until the next
 * attempt, next to what failed.
 */
export function useUserActions(user: User) {
  const viewer = useViewer();
  const [confirming, setConfirming] = useState<ConfirmableAction | null>(null);

  const changeRole = useChangeRoleMutation();
  const deactivate = useDeactivateUserMutation();
  const reactivate = useReactivateUserMutation();
  const resend = useResendActivationMutation();
  const mutations = [changeRole, deactivate, reactivate, resend];

  const isPending = mutations.some((mutation) => mutation.isPending);
  const failed = mutations.find((mutation) => mutation.error);

  function choose(action: UserAction) {
    mutations.forEach((mutation) => mutation.reset());
    if (action === 'edit') {
      router.push({ pathname: '/user-form/[id]', params: { id: String(user.id) } });
    } else {
      setConfirming(action);
    }
  }

  function confirm() {
    const action = confirming;
    setConfirming(null);
    const toast = {
      onSuccess: ({ message }: { message: string }) => useToastStore.getState().show(message),
    };

    if (action === 'changeRole') changeRole.mutate({ id: user.id, role: otherRole(user) }, toast);
    if (action === 'deactivate') deactivate.mutate(user.id, toast);
    if (action === 'reactivate') reactivate.mutate(user.id, toast);
    if (action === 'resendActivation') resend.mutate(user.id, toast);
  }

  return {
    actions: availableActions(user, viewer),
    choose,
    confirming,
    confirm,
    cancel: () => setConfirming(null),
    isPending,
    error: failed ? toDisplayMessage(failed.error) : null,
  };
}
