import { Link, type Href } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AvatarEditor } from '@/features/shared/components/avatar-editor';
import { ScreenMessage } from '@/features/shared/components/screen-message';
import { UserAvatar } from '@/features/shared/components/user-avatar';
import { useAvatarEditor } from '@/features/shared/hooks/use-avatar-editor';
import { usePalette } from '@/features/shared/hooks/use-palette';
import type { User } from '@/features/shared/schemas/user';
import { ApiError } from '@/lib/http';
import { toDisplayMessage } from '@/features/shared/utils/api-errors';
import { font } from '@/features/shared/utils/typography';
import { formatDate } from '@/features/shared/utils/dates';
import { ROLE_LABELS, fullName } from '@/features/shared/utils/user';
import { UserStatusBadge } from '@/features/users/components/user-status-badge';
import { UserActionDialogs } from '@/features/users/components/user-action-dialogs';
import { UserActionsMenu } from '@/features/users/components/user-actions-menu';
import { useUserActions, useViewer } from '@/features/users/hooks/use-user-actions';
import { useUserQuery } from '@/features/users/query/use-user-query';
import { canChangeAvatar, canSeeHistory } from '@/features/users/utils/user-actions';

/**
 * One account. Everyone sees the details; an admin also gets the account's actions in the header
 * menu, can change the picture, and opens the two audit trails. `id` is `null` when the link
 * carried something that is not an id — the same answer as an id that does not exist.
 */
export function UserDetailScreen({ id }: { id: number | null }) {
  if (id === null) return <NotFound />;
  return <UserDetail id={id} />;
}

function UserDetail({ id }: { id: number }) {
  const { data: user, error, refetch } = useUserQuery(id);

  if (user === undefined) {
    if (error instanceof ApiError && error.status === 404) return <NotFound />;

    return (
      <>
        <Stack.Title>Korisnik</Stack.Title>
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.fill}>
          {error ? (
            <ScreenMessage
              icon={{ ios: 'wifi.exclamationmark', android: 'cloud_off', web: 'cloud_off' }}
              testID="user-load-error"
              title="Korisnik nije učitan"
              message={toDisplayMessage(error)}
              action={{ label: 'Pokušaj ponovo', onPress: () => void refetch() }}
            />
          ) : (
            <View style={styles.loading}>
              <ActivityIndicator size="large" accessibilityLabel="Učitavanje korisnika" />
            </View>
          )}
        </ScrollView>
      </>
    );
  }

  return <UserDetails user={user} />;
}

function UserDetails({ user }: { user: User }) {
  const palette = usePalette();
  const name = fullName(user);
  const viewer = useViewer();
  const isSelf = viewer.id === user.id;
  const actions = useUserActions(user);
  const avatar = useAvatarEditor(user);
  const error = actions.error ?? avatar.error;

  return (
    <>
      <Stack.Title style={font('semibold')}>{name}</Stack.Title>
      <UserActionsMenu
        actions={actions.actions}
        disabled={actions.isPending}
        onChoose={actions.choose}
      />

      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          {canChangeAvatar(user, viewer) ? (
            <AvatarEditor user={user} editor={avatar} size={96} />
          ) : (
            <UserAvatar name={user.name} surname={user.surname} url={user.avatar_url} size={96} />
          )}
          <Text accessibilityRole="header" style={[styles.name, { color: palette.label }]}>
            {name}
          </Text>
          <View style={styles.badges}>
            <UserStatusBadge user={user} />
            {isSelf ? (
              <View style={[styles.selfBadge, { backgroundColor: palette.avatarBackground }]}>
                <Text style={[styles.selfBadgeLabel, { color: palette.avatarText }]}>Vi</Text>
              </View>
            ) : null}
            {actions.isPending ? <ActivityIndicator accessibilityLabel="Čuvanje" /> : null}
          </View>
        </View>

        {error ? (
          <View
            accessible
            accessibilityRole="alert"
            style={[styles.alert, { backgroundColor: palette.dangerBackground }]}>
            <Text style={[styles.alertText, { color: palette.danger }]}>{error}</Text>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: palette.cardBackground }]}>
          <Field label="Email" value={user.email} />
          <Field label="Uloga" value={ROLE_LABELS[user.role]} />
          <Field label="Kreiran" value={formatDate(user.created_at)} />
          {user.email_verified_at ? (
            <Field label="Aktiviran" value={formatDate(user.email_verified_at)} />
          ) : null}
          {user.deactivated_at ? (
            <Field label="Isključen" value={formatDate(user.deactivated_at)} />
          ) : null}
        </View>

        {canSeeHistory(viewer) ? (
          <View style={[styles.card, { backgroundColor: palette.cardBackground }]}>
            <HistoryLink
              href={{ pathname: '/users/[id]/logs', params: { id: String(user.id) } }}
              icon={{ ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }}
              label="Istorija izmena"
            />
            <View style={[styles.separator, { backgroundColor: palette.fieldBorder }]} />
            <HistoryLink
              href={{ pathname: '/users/[id]/logins', params: { id: String(user.id) } }}
              icon={{ ios: 'person.badge.key', android: 'login', web: 'login' }}
              label="Istorija prijava"
            />
          </View>
        ) : null}
      </ScrollView>

      <UserActionDialogs user={user} actions={actions} />
    </>
  );
}

function HistoryLink({
  href,
  icon,
  label,
}: {
  href: Href;
  icon: SymbolViewProps['name'];
  label: string;
}) {
  const palette = usePalette();
  return (
    <Link href={href} asChild>
      <Pressable accessibilityLabel={label} android_ripple={{ color: 'rgba(127,127,127,0.2)' }}>
        {({ pressed }) => (
          <View
            style={[styles.linkRow, pressed && process.env.EXPO_OS === 'ios' && styles.pressed]}>
            <SymbolView name={icon} size={20} tintColor={palette.label} />
            <Text style={[styles.linkLabel, { color: palette.label }]}>{label}</Text>
            {process.env.EXPO_OS === 'ios' ? (
              <SymbolView name="chevron.right" size={14} tintColor={palette.secondaryLabel} />
            ) : null}
          </View>
        )}
      </Pressable>
    </Link>
  );
}

/** A label over its value, read by screen readers as one sentence. */
function Field({ label, value }: { label: string; value: string }) {
  const palette = usePalette();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.field}>
      <Text style={[styles.fieldLabel, { color: palette.secondaryLabel }]}>{label}</Text>
      <Text selectable style={[styles.fieldValue, { color: palette.label }]}>
        {value}
      </Text>
    </View>
  );
}

function NotFound() {
  return (
    <>
      <Stack.Title>Korisnik</Stack.Title>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.fill}>
        <ScreenMessage
          icon={{
            ios: 'person.crop.circle.badge.questionmark',
            android: 'person_off',
            web: 'person_off',
          }}
          title="Korisnik ne postoji"
          message="Nalog je možda uklonjen ili link nije ispravan."
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  fill: {
    flexGrow: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  identity: {
    alignItems: 'center',
    gap: 8,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selfBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  selfBadgeLabel: {
    ...font('medium'),
    fontSize: 13,
  },
  alert: {
    borderRadius: 10,
    padding: 14,
  },
  alertText: {
    ...font(),
    fontSize: 15,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 32,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  linkLabel: {
    ...font('medium'),
    fontSize: 17,
    flex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
  name: {
    ...font('semibold'),
    fontSize: 22,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  field: {
    paddingVertical: 10,
    gap: 2,
  },
  fieldLabel: {
    ...font(),
    fontSize: 14,
  },
  fieldValue: {
    ...font('medium'),
    fontSize: 17,
  },
});
