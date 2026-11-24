import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Linking } from 'react-native';

import { t } from '@/lib/i18n';
import { avatarAssetSchema, type AvatarAsset } from '@/features/shared/schemas/avatar';

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

export type AvatarDialog = 'confirmRemove' | 'cameraBlocked' | null;

/**
 * Choosing a picture, apart from what is then done with it: take a photo, choose one, or remove
 * the current one. Shared by the account's avatar (uploaded at once) and registration (kept until
 * the account is made).
 *
 * Permissions are asked for the camera only. The photo library is reached through the system's
 * photo picker, in which the user hands over one chosen image — the app never gets, or asks for,
 * access to the whole library. A camera refusal the system will not ask about again leads to the
 * settings app instead of a dead button.
 */
export function useAvatarPicker({
  onPicked,
  onRemove,
  isBusy = false,
}: {
  onPicked: (asset: AvatarAsset) => void;
  onRemove: () => void;
  isBusy?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<AvatarDialog>(null);

  function receive(result: ImagePicker.ImagePickerResult) {
    if (result.canceled) return;
    const parsed = avatarAssetSchema.safeParse(result.assets[0]);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('avatar.unusable'));
      return;
    }
    onPicked(parsed.data);
  }

  async function takePhoto() {
    if (isBusy) return;
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      if (!permission.canAskAgain) setDialog('cameraBlocked');
      return;
    }
    receive(
      await ImagePicker.launchCameraAsync({
        ...PICKER_OPTIONS,
        cameraType: ImagePicker.CameraType.front,
      })
    );
  }

  async function chooseFromLibrary() {
    if (isBusy) return;
    setError(null);
    receive(await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS));
  }

  return {
    /** A picture refused on the phone, before anything was sent. */
    error,
    clearError: () => setError(null),
    dialog,
    takePhoto,
    chooseFromLibrary,
    requestRemove: () => {
      if (!isBusy) setDialog('confirmRemove');
    },
    confirmRemove: () => {
      setDialog(null);
      setError(null);
      onRemove();
    },
    openSettings: () => {
      setDialog(null);
      void Linking.openSettings();
    },
    dismissDialog: () => setDialog(null),
  };
}

/** What `AvatarEditor` draws and calls, whoever owns the picture. */
export interface AvatarEditorState {
  isPending: boolean;
  error: string | null;
  dialog: AvatarDialog;
  canRemove: boolean;
  takePhoto: () => Promise<void>;
  chooseFromLibrary: () => Promise<void>;
  requestRemove: () => void;
  confirmRemove: () => void;
  openSettings: () => void;
  dismissDialog: () => void;
}
