import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { User, UserRole } from '@/features/shared/schemas/user';
import { useSessionStore } from '@/features/shared/stores/session';
import {
  changeUserRole,
  createUser,
  deactivateUser,
  reactivateUser,
  resendActivation,
  updateUser,
} from '@/features/users/api/users';
import { usersKeys } from '@/features/users/query/keys';
import type { CreateUserForm, UpdateUserForm } from '@/features/users/schemas/user-form';

/**
 * Every write answers with the account as it now is. It goes straight into the detail cache (the
 * screen updates without a refetch), the rest of the feature is marked stale — the list and the
 * audit trail changed too — and, when the account is the signed-in user's own, into the session.
 * Messages are shown by the caller, which knows when (a form shows it after closing).
 */
function useAccountWrite<V>(write: (vars: V) => Promise<{ message: string; data: User }>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: write,
    onSuccess: ({ data }) => {
      queryClient.setQueryData(usersKeys.detail(data.id), data);
      void queryClient.invalidateQueries({ queryKey: usersKeys.root });
      const session = useSessionStore.getState();
      if (session.user?.id === data.id) session.replaceUser(data);
    },
  });
}

export function useCreateUserMutation() {
  return useAccountWrite((form: CreateUserForm) => createUser(form));
}

export function useUpdateUserMutation() {
  return useAccountWrite(({ id, form }: { id: number; form: UpdateUserForm }) =>
    updateUser(id, form)
  );
}

export function useChangeRoleMutation() {
  return useAccountWrite(({ id, role }: { id: number; role: UserRole }) =>
    changeUserRole(id, role)
  );
}

export function useDeactivateUserMutation() {
  return useAccountWrite((id: number) => deactivateUser(id));
}

export function useReactivateUserMutation() {
  return useAccountWrite((id: number) => reactivateUser(id));
}

/** No account comes back; only the audit trail changed. */
export function useResendActivationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => resendActivation(id),
    onSuccess: (_response, id) =>
      void queryClient.invalidateQueries({ queryKey: usersKeys.logs(id) }),
  });
}
