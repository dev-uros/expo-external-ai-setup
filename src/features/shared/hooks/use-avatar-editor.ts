import {
  useRemoveAvatarMutation,
  useUploadAvatarMutation,
} from '@/features/shared/query/use-avatar-mutations';
import { useAvatarPicker, type AvatarEditorState } from '@/features/shared/hooks/use-avatar-picker';
import type { User } from '@/features/shared/schemas/user';
import { toDisplayMessage } from '@/features/shared/utils/api-errors';

/** The signed-in account's picture: a new one is uploaded at once, removing it is immediate. */
export function useAvatarEditor(user: User): AvatarEditorState {
  const upload = useUploadAvatarMutation();
  const remove = useRemoveAvatarMutation();
  const isPending = upload.isPending || remove.isPending;

  const picker = useAvatarPicker({
    isBusy: isPending,
    onPicked: (asset) => {
      remove.reset();
      upload.mutate(asset);
    },
    onRemove: () => {
      upload.reset();
      remove.mutate();
    },
  });

  const failure = upload.error ?? remove.error;

  return {
    ...picker,
    isPending,
    error: picker.error ?? (failure ? toDisplayMessage(failure) : null),
    canRemove: user.avatar_url !== null,
  };
}
