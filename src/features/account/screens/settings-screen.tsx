import EditIcon from '@expo/material-symbols/edit.xml';
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AvatarEditor } from '@/features/shared/components/avatar-editor';
import { useAvatarEditor } from '@/features/shared/hooks/use-avatar-editor';
import { usePalette } from '@/features/shared/hooks/use-palette';
import type { User } from '@/features/shared/schemas/user';
import { useSessionStore } from '@/features/shared/stores/session';
import { font } from '@/features/shared/utils/typography';
import { personalName } from '@/features/shared/utils/user';

/**
 * Settings: the signed-in account — picture (tap it), name, username, address — with the pencil
 * opening the profile form, and whatever the route places under it: language, theme,
 * notifications, about, sign-out, deleting the account.
 */
export function SettingsScreen({ footer }: { footer?: ReactNode }) {
  const user = useSessionStore((state) => state.user);
  const { t } = useTranslation();

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Stack.Title large style={font('semibold')} largeStyle={font('bold')}>
          {t('tabs.settings')}
        </Stack.Title>
        {user ? <AccountCard user={user} /> : null}
        {footer}
      </ScrollView>

      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon={process.env.EXPO_OS === 'ios' ? 'pencil' : EditIcon}
          accessibilityLabel={t('account.edit.title')}
          onPress={() => router.push('/edit-profile')}
        />
      </Stack.Toolbar>
    </>
  );
}

function AccountCard({ user }: { user: User }) {
  const palette = usePalette();
  const avatar = useAvatarEditor(user);
  const name = personalName(user);

  return (
    <View style={[styles.card, { backgroundColor: palette.cardBackground }]}>
      <View style={styles.row}>
        <AvatarEditor name={user.display_name} url={user.avatar_url} editor={avatar} />
        <View style={styles.identity}>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            style={[styles.name, { color: palette.label }]}>
            {name ?? user.username}
          </Text>
          {name ? (
            <Text style={[styles.secondary, { color: palette.secondaryLabel }]}>
              {`@${user.username}`}
            </Text>
          ) : null}
          <Text
            selectable
            numberOfLines={1}
            style={[styles.secondary, { color: palette.secondaryLabel }]}>
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
