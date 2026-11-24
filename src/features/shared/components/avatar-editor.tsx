import { MenuView } from '@expo/ui/community/menu';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { UserAvatar } from '@/features/shared/components/user-avatar';
import type { AvatarEditorState } from '@/features/shared/hooks/use-avatar-picker';
import { ConfirmDialog } from '@/features/shared/components/confirm-dialog';
import { usePalette } from '@/features/shared/hooks/use-palette';

/**
 * The profile picture, editable: a tap opens the platform's own menu — take a photo, choose one,
 * remove the current one. While a change is being saved the avatar shows progress over itself.
 * The screen owns `editor` (`useAvatarEditor`, or `useLocalAvatar` before there is an account)
 * so it can place the error where it fits.
 */
export function AvatarEditor({
  name,
  url,
  editor,
  size = 64,
}: {
  name: string;
  url: string | null;
  editor: AvatarEditorState;
  size?: number;
}) {
  const palette = usePalette();
  const { t } = useTranslation();

  return (
    <>
      <MenuView
        title={t('avatar.menu_title')}
        testID="avatar-menu"
        actions={[
          { id: 'camera', title: t('avatar.take_photo'), image: 'camera' },
          { id: 'library', title: t('avatar.choose'), image: 'photo.on.rectangle' },
          {
            id: 'remove',
            title: t('avatar.remove'),
            image: 'trash',
            attributes: { destructive: true, hidden: !editor.canRemove },
          },
        ]}
        onPressAction={({ nativeEvent }) => {
          if (nativeEvent.event === 'camera') void editor.takePhoto();
          if (nativeEvent.event === 'library') void editor.chooseFromLibrary();
          if (nativeEvent.event === 'remove') editor.requestRemove();
        }}>
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={t('avatar.change')}
          accessibilityState={{ busy: editor.isPending }}>
          <UserAvatar name={name} url={url} size={size} />
          {editor.isPending ? (
            <View style={[styles.overlay, { borderRadius: size / 2 }]}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: palette.cardBackground }]}>
              <SymbolView
                name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
                size={14}
                tintColor={palette.avatarText}
              />
            </View>
          )}
        </View>
      </MenuView>

      <ConfirmDialog
        visible={editor.dialog === 'confirmRemove'}
        title={t('avatar.remove_title')}
        message={t('avatar.remove_message')}
        confirmLabel={t('avatar.remove_confirm')}
        destructive
        onConfirm={editor.confirmRemove}
        onCancel={editor.dismissDialog}
      />
      <ConfirmDialog
        visible={editor.dialog === 'cameraBlocked'}
        title={t('avatar.camera_blocked_title')}
        message={t('avatar.camera_blocked_message')}
        confirmLabel={t('avatar.open_settings')}
        onConfirm={editor.openSettings}
        onCancel={editor.dismissDialog}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
