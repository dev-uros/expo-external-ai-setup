import { useMutation } from '@tanstack/react-query';

import { removeAvatar, uploadAvatar } from '@/features/shared/api/avatar';
import type { AvatarAsset } from '@/features/shared/schemas/avatar';
import type { User } from '@/features/shared/schemas/user';
import { useSessionStore } from '@/features/shared/stores/session';
import { useToastStore } from '@/features/shared/stores/toast';

/** The answer is the updated account: it replaces the session's, and its message is a toast. */
function onSaved({ message, data }: { message: string; data: User }) {
  useSessionStore.getState().replaceUser(data);
  useToastStore.getState().show(message);
}

export function useUploadAvatarMutation() {
  return useMutation({
    mutationFn: (asset: AvatarAsset) => uploadAvatar(asset),
    onSuccess: onSaved,
  });
}

export function useRemoveAvatarMutation() {
  return useMutation({
    mutationFn: () => removeAvatar(),
    onSuccess: onSaved,
  });
}
