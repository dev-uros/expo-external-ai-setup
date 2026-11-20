import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateProfile } from '@/features/profile/api/profile';
import type { ProfileForm } from '@/features/profile/schemas/profile-form';
import { usersRoot } from '@/features/shared/query/keys';
import { useSessionStore } from '@/features/shared/stores/session';

export interface UpdateProfileVars {
  id: number;
  form: ProfileForm;
}

/**
 * Saves the signed-in user's own details. The session holds the user, not a query, so the
 * answer goes straight into it — every screen that shows the name updates at once. The users
 * list and detail cache the same account, so they are marked stale too.
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, form }: UpdateProfileVars) => updateProfile(id, form),
    onSuccess: ({ data }) => {
      useSessionStore.getState().replaceUser(data);
      void queryClient.invalidateQueries({ queryKey: usersRoot });
    },
  });
}
