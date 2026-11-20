import { Stack } from 'expo-router/stack';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenMessage } from '@/features/shared/components/screen-message';
import { UserAvatar } from '@/features/shared/components/user-avatar';
import { usePalette } from '@/features/shared/hooks/use-palette';
import type { User } from '@/features/shared/schemas/user';
import { ApiError } from '@/lib/http';
import { toDisplayMessage } from '@/features/shared/utils/api-errors';
import { labelColor, secondaryLabelColor } from '@/features/shared/utils/colors';
import { font } from '@/features/shared/utils/typography';
import { ROLE_LABELS, formatDate, fullName } from '@/features/shared/utils/user';
import { UserStatusBadge } from '@/features/users/components/user-status-badge';
import { useUserQuery } from '@/features/users/query/use-user-query';

/**
 * One account, read-only. `id` is `null` when the link carried something that is not an id —
 * that is the same answer for the user as an id that does not exist.
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

  return (
    <>
      <Stack.Title style={font('semibold')}>{name}</Stack.Title>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          <UserAvatar name={user.name} surname={user.surname} url={user.avatar_url} size={96} />
          <Text accessibilityRole="header" style={[styles.name, { color: labelColor }]}>
            {name}
          </Text>
          <UserStatusBadge user={user} style={styles.centered} />
        </View>

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
      </ScrollView>
    </>
  );
}

/** A label over its value, read by screen readers as one sentence. */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.field}>
      <Text style={[styles.fieldLabel, { color: secondaryLabelColor }]}>{label}</Text>
      <Text selectable style={[styles.fieldValue, { color: labelColor }]}>
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
  centered: {
    alignSelf: 'center',
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
