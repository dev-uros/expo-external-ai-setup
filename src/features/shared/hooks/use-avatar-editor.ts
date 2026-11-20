import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Linking } from 'react-native';

import {
  useRemoveAvatarMutation,
  useUploadAvatarMutation,
} from '@/features/shared/query/use-avatar-mutations';
import { avatarAssetSchema } from '@/features/shared/schemas/avatar';
import type { User } from '@/features/shared/schemas/user';
import { toDisplayMessage } from '@/features/shared/utils/api-errors';

/** The picker's own square crop, so what is uploaded is what the circle will show. */
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: 'images',
  allowsEditing: true,
  aspect: [1, 1],
  shape: 'oval',
  // Re-encoded to JPEG at this quality: a phone photo comes out well under the 5 MB limit, and
  // the server makes a 512x512 WebP of it anyway.
  quality: 0.8,
};

export type Dialog = 'confirmRemove' | 'cameraBlocked' | null;

/**
 * Everything behind tapping the avatar: take a photo, choose one, or remove the current one.
 *
 * Permissions are asked for the camera only. The photo library is reached through the system's
 * photo picker (Android Photo Picker, iOS PHPicker), in which the user hands over one chosen
 * image — the app never gets, or asks for, access to the whole library. A camera refusal the
 * system will not ask about again leads to the settings app instead of a dead button.
 */
export function useAvatarEditor(user: User) {
  const upload = useUploadAvatarMutation();
  const remove = useRemoveAvatarMutation();
  const [localError, setLocalError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  const isPending = upload.isPending || remove.isPending;
  const failure = upload.error ?? remove.error;
  const error = localError ?? (failure ? toDisplayMessage(failure) : null);

  function clear() {
    setLocalError(null);
    upload.reset();
    remove.reset();
  }

  function send(result: ImagePicker.ImagePickerResult) {
    if (result.canceled) return;
    const parsed = avatarAssetSchema.safeParse(result.assets[0]);
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? 'Ova slika se ne može koristiti.');
      return;
    }
    upload.mutate({ id: user.id, asset: parsed.data });
  }

  async function takePhoto() {
    if (isPending) return;
    clear();
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      if (!permission.canAskAgain) setDialog('cameraBlocked');
      return;
    }
    send(
      await ImagePicker.launchCameraAsync({
        ...PICKER_OPTIONS,
        cameraType: ImagePicker.CameraType.front,
      })
    );
  }

  async function chooseFromLibrary() {
    if (isPending) return;
    clear();
    send(await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS));
  }

  return {
    isPending,
    /** Shown under the avatar; `null` when there is nothing to say. */
    error,
    dialog,
    canRemove: user.avatar_url !== null,
    takePhoto,
    chooseFromLibrary,
    requestRemove: () => {
      if (!isPending) setDialog('confirmRemove');
    },
    confirmRemove: () => {
      setDialog(null);
      clear();
      remove.mutate(user.id);
    },
    openSettings: () => {
      setDialog(null);
      void Linking.openSettings();
    },
    dismissDialog: () => setDialog(null),
  };
}
