import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { removeAvatar, uploadAvatar } from '@/features/shared/api/avatar';
import type { AvatarAsset } from '@/features/shared/schemas/avatar';
import { usersRoot } from '@/features/shared/query/keys';
import type { User } from '@/features/shared/schemas/user';
import { useSessionStore } from '@/features/shared/stores/session';
import { useToastStore } from '@/features/shared/stores/toast';

/**
 * The answer is the updated account. An admin may change anyone's picture: it goes into the
 * session only when it is the signed-in user's own. Its message goes into a toast, and the users
 * cache — which shows the same picture — is marked stale.
 */
function onSaved(queryClient: QueryClient, { message, data }: { message: string; data: User }) {
  const session = useSessionStore.getState();
  if (session.user?.id === data.id) session.replaceUser(data);
  useToastStore.getState().show(message);
  void queryClient.invalidateQueries({ queryKey: usersRoot });
}

export function useUploadAvatarMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, asset }: { id: number; asset: AvatarAsset }) => uploadAvatar(id, asset),
    onSuccess: (response) => onSaved(queryClient, response),
  });
}

export function useRemoveAvatarMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => removeAvatar(id),
    onSuccess: (response) => onSaved(queryClient, response),
  });
}
