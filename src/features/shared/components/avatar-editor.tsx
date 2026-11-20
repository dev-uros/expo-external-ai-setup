import { MenuView } from '@expo/ui/community/menu';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { UserAvatar } from '@/features/shared/components/user-avatar';
import type { useAvatarEditor } from '@/features/shared/hooks/use-avatar-editor';
import { ConfirmDialog } from '@/features/shared/components/confirm-dialog';
import { usePalette } from '@/features/shared/hooks/use-palette';
import type { User } from '@/features/shared/schemas/user';

/**
 * The profile picture, editable: a tap opens the platform's own menu — take a photo, choose one,
 * remove the current one. While a change is being saved the avatar shows progress over itself.
 * The screen owns `editor` (from `useAvatarEditor`) so it can place the error where it fits.
 */
export function AvatarEditor({
  user,
  editor,
  size = 64,
}: {
  user: User;
  editor: ReturnType<typeof useAvatarEditor>;
  size?: number;
}) {
  const palette = usePalette();

  return (
    <>
      <MenuView
        title="Profilna slika"
        testID="avatar-menu"
        actions={[
          { id: 'camera', title: 'Fotografiši', image: 'camera' },
          { id: 'library', title: 'Izaberi iz galerije', image: 'photo.on.rectangle' },
          {
            id: 'remove',
            title: 'Ukloni sliku',
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
          accessibilityLabel="Promeni profilnu sliku"
          accessibilityState={{ busy: editor.isPending }}>
          <UserAvatar name={user.name} surname={user.surname} url={user.avatar_url} size={size} />
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
        title="Ukloniti profilnu sliku?"
        message="Umesto slike biće prikazani vaši inicijali."
        confirmLabel="Ukloni"
        destructive
        onConfirm={editor.confirmRemove}
        onCancel={editor.dismissDialog}
      />
      <ConfirmDialog
        visible={editor.dialog === 'cameraBlocked'}
        title="Pristup kameri nije dozvoljen"
        message="Dozvolite Backoffice-u pristup kameri u podešavanjima telefona."
        confirmLabel="Otvori podešavanja"
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
