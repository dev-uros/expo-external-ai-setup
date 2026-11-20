import EditIcon from '@expo/material-symbols/edit.xml';
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AvatarEditor } from '@/features/profile/components/avatar-editor';
import { useAvatarEditor } from '@/features/profile/hooks/use-avatar-editor';
import { usePalette } from '@/features/shared/hooks/use-palette';
import type { User } from '@/features/shared/schemas/user';
import { useSessionStore } from '@/features/shared/stores/session';
import { labelColor, secondaryLabelColor } from '@/features/shared/utils/colors';
import { font } from '@/features/shared/utils/typography';

export const ROLE_LABELS = { admin: 'Administrator', user: 'Korisnik' } as const;

/**
 * The signed-in account — picture, name, role, email.
 *
 * Anyone may change their own picture (tap it). Editing the details is offered to admins only,
 * as on the web: `PUT /users/{id}` is an admin endpoint, own account included, so a plain user
 * would only get a 403. `footer` is whatever the route places under the account — sign-out,
 * which belongs to the auth feature.
 */
export function ProfileScreen({ footer }: { footer?: ReactNode }) {
  const user = useSessionStore((state) => state.user);

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Stack.Title large style={font('semibold')} largeStyle={font('bold')}>
          Profil
        </Stack.Title>
        {user ? <AccountCard user={user} /> : null}
        {footer}
      </ScrollView>

      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          hidden={user?.role !== 'admin'}
          icon={process.env.EXPO_OS === 'ios' ? 'pencil' : EditIcon}
          accessibilityLabel="Izmeni profil"
          onPress={() => router.push('/edit-profile')}
        />
      </Stack.Toolbar>
    </>
  );
}

function AccountCard({ user }: { user: User }) {
  const palette = usePalette();
  const avatar = useAvatarEditor(user);

  return (
    <View style={[styles.card, { backgroundColor: palette.cardBackground }]}>
      <View style={styles.row}>
        <AvatarEditor user={user} editor={avatar} />
        <View style={styles.identity}>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            style={[styles.name, { color: labelColor }]}>
            {`${user.name} ${user.surname}`}
          </Text>
          <Text style={[styles.secondary, { color: secondaryLabelColor }]}>
            {ROLE_LABELS[user.role]}
          </Text>
          <Text numberOfLines={1} style={[styles.secondary, { color: secondaryLabelColor }]}>
            {user.email}
          </Text>
        </View>
      </View>
      {avatar.error ? (
        <Text
          accessible
          accessibilityRole="alert"
          style={[styles.error, { color: palette.danger }]}>
          {avatar.error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 24,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  identity: {
    flex: 1,
    gap: 4,
  },
  name: {
    ...font('semibold'),
    fontSize: 20,
  },
  secondary: {
    ...font(),
    fontSize: 15,
  },
  error: {
    ...font(),
    fontSize: 14,
  },
});
