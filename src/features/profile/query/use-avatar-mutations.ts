import { useMutation } from '@tanstack/react-query';

import { removeAvatar, uploadAvatar } from '@/features/profile/api/avatar';
import type { AvatarAsset } from '@/features/profile/schemas/avatar';
import type { User } from '@/features/shared/schemas/user';
import { useSessionStore } from '@/features/shared/stores/session';
import { useToastStore } from '@/features/shared/stores/toast';

/** The answer is the updated account: into the session it goes, and its message into a toast. */
function onSaved({ message, data }: { message: string; data: User }) {
  useSessionStore.getState().replaceUser(data);
  useToastStore.getState().show(message);
}

export function useUploadAvatarMutation() {
  return useMutation({
    mutationFn: ({ id, asset }: { id: number; asset: AvatarAsset }) => uploadAvatar(id, asset),
    onSuccess: onSaved,
  });
}

export function useRemoveAvatarMutation() {
  return useMutation({
    mutationFn: (id: number) => removeAvatar(id),
    onSuccess: onSaved,
  });
}
