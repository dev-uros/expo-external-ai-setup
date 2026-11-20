import { useMutation } from '@tanstack/react-query';

import { updateProfile } from '@/features/profile/api/profile';
import type { ProfileForm } from '@/features/profile/schemas/profile-form';
import { useSessionStore } from '@/features/shared/stores/session';

export interface UpdateProfileVars {
  id: number;
  form: ProfileForm;
}

/**
 * Saves the signed-in user's own details. The session holds the user, not a query, so the
 * answer goes straight into it — every screen that shows the name updates at once.
 */
export function useUpdateProfileMutation() {
  return useMutation({
    mutationFn: ({ id, form }: UpdateProfileVars) => updateProfile(id, form),
    onSuccess: ({ data }) => useSessionStore.getState().replaceUser(data),
  });
}
