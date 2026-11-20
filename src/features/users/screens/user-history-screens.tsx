import { FlashList } from '@shopify/flash-list';
import type { UseInfiniteQueryResult } from '@tanstack/react-query';
import { Stack } from 'expo-router/stack';
import { useState, type ReactElement } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenMessage } from '@/features/shared/components/screen-message';
import { usePalette, type Palette } from '@/features/shared/hooks/use-palette';
import { toDisplayMessage } from '@/features/shared/utils/api-errors';
import { formatDateTime } from '@/features/shared/utils/dates';
import { font } from '@/features/shared/utils/typography';
import { fullName } from '@/features/shared/utils/user';
import {
  OUTCOME_LABELS,
  type LoginAttempt,
  type LoginOutcome,
  type UserLog,
} from '@/features/users/schemas/history';
import {
  useUserLoginsQuery,
  useUserLogsQuery,
} from '@/features/users/query/use-user-history-queries';
import { useUserQuery } from '@/features/users/query/use-user-query';
import { changedFields, eventLabel } from '@/features/users/utils/log-entries';

/**
 * The two audit trails of one account, admin-only. Each is an infinite list — the next 25 load as
 * the end comes into view — with the same states as every list: loading, error with retry,
 * empty, content, and a failed refresh that keeps what is shown.
 */

export function UserLogsScreen({ id }: { id: number | null }) {
  if (id === null) return <NotFound title="Istorija izmena" />;
  return <UserLogs id={id} />;
}

export function UserLoginsScreen({ id }: { id: number | null }) {
  if (id === null) return <NotFound title="Istorija prijava" />;
  return <UserLogins id={id} />;
}

function UserLogs({ id }: { id: number }) {
  return (
    <HistoryList
      title="Istorija izmena"
      userId={id}
      query={useUserLogsQuery(id)}
      empty="Na ovom nalogu još ništa nije menjano."
      renderItem={(log) => <LogRow log={log} />}
    />
  );
}

function UserLogins({ id }: { id: number }) {
  return (
    <HistoryList
      title="Istorija prijava"
      userId={id}
      query={useUserLoginsQuery(id)}
      empty="Na ovaj nalog se još niko nije prijavljivao."
      renderItem={(attempt) => <LoginRow attempt={attempt} />}
    />
  );
}

interface HistoryListProps<T extends { id: number }> {
  title: string;
  userId: number;
  query: UseInfiniteQueryResult<T[]>;
  empty: string;
  renderItem: (item: T) => ReactElement;
}

function HistoryList<T extends { id: number }>({
  title,
  userId,
  query,
  empty,
  renderItem,
}: HistoryListProps<T>) {
  const palette = usePalette();
  const [refreshing, setRefreshing] = useState(false);
  // The person's name under the title, from what the app already knows about them.
  const { data: user } = useUserQuery(userId);
  const { data: items, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  async function refresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  return (
    <>
      <Stack.Title style={font('semibold')}>{title}</Stack.Title>
      {items === undefined ? (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.fill}>
          {error ? (
            <ScreenMessage
              testID="history-load-error"
              icon={{ ios: 'wifi.exclamationmark', android: 'cloud_off', web: 'cloud_off' }}
              title={`${title} nije učitana`}
              message={toDisplayMessage(error)}
              action={{ label: 'Pokušaj ponovo', onPress: () => void refetch() }}
            />
          ) : (
            <View style={styles.loading}>
              <ActivityIndicator size="large" accessibilityLabel={`Učitavanje: ${title}`} />
            </View>
          )}
        </ScrollView>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => renderItem(item)}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: palette.fieldBorder }]} />
          )}
          ListHeaderComponent={
            <View style={styles.header}>
              {user ? (
                <Text style={[styles.subtitle, { color: palette.secondaryLabel }]}>
                  {fullName(user)}
                </Text>
              ) : null}
              {error && !isFetchingNextPage ? (
                <Text
                  accessibilityRole="alert"
                  style={[styles.inlineError, { color: palette.danger }]}>
                  {`Učitavanje nije uspelo: ${toDisplayMessage(error)}`}
                </Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <ScreenMessage
              icon={{ ios: 'clock', android: 'history', web: 'history' }}
              title="Još nema zapisa"
              message={empty}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={styles.footer} accessibilityLabel="Učitavanje još zapisa" />
            ) : null
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={refresh}
          contentInsetAdjustmentBehavior="automatic"
        />
      )}
    </>
  );
}

function LogRow({ log }: { log: UserLog }) {
  const palette = usePalette();
  const changes = changedFields(log);
  const actor = log.actor ? fullName(log.actor) : 'Sistem';

  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={[styles.rowTitle, { color: palette.label }]}>{eventLabel(log.event)}</Text>
        <Text style={[styles.meta, { color: palette.secondaryLabel }]}>
          {formatDateTime(log.created_at)}
        </Text>
      </View>
      {changes.map((change) => (
        <Text
          key={change.field}
          accessibilityLabel={`${change.label}: ${change.from} u ${change.to}`}
          style={[styles.change, { color: palette.label }]}>
          <Text style={{ color: palette.secondaryLabel }}>{`${change.label}: `}</Text>
          {`${change.from} → ${change.to}`}
        </Text>
      ))}
      <Text style={[styles.meta, { color: palette.secondaryLabel }]}>
        {log.ip_address ? `${actor} · ${log.ip_address}` : actor}
      </Text>
    </View>
  );
}

function outcomeColors(outcome: LoginOutcome, palette: Palette) {
  switch (outcome) {
    case 'succeeded':
      return { color: palette.success, backgroundColor: palette.successBackground };
    case 'invalid_credentials':
      return { color: palette.warning, backgroundColor: palette.warningBackground };
    case 'account_deactivated':
      return { color: palette.danger, backgroundColor: palette.dangerBackground };
  }
}

function LoginRow({ attempt }: { attempt: LoginAttempt }) {
  const palette = usePalette();
  const { color, backgroundColor } = outcomeColors(attempt.outcome, palette);

  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <View style={[styles.badge, { backgroundColor }]}>
          <Text style={[styles.badgeLabel, { color }]}>{OUTCOME_LABELS[attempt.outcome]}</Text>
        </View>
        <Text style={[styles.meta, { color: palette.secondaryLabel }]}>
          {formatDateTime(attempt.created_at)}
        </Text>
      </View>
      <Text style={[styles.change, { color: palette.label }]}>{attempt.email}</Text>
      <Text style={[styles.meta, { color: palette.secondaryLabel }]}>
        {attempt.ip_address ?? '—'}
      </Text>
      {attempt.user_agent ? (
        <Text numberOfLines={2} style={[styles.meta, { color: palette.secondaryLabel }]}>
          {attempt.user_agent}
        </Text>
      ) : null}
    </View>
  );
}

function NotFound({ title }: { title: string }) {
  return (
    <>
      <Stack.Title>{title}</Stack.Title>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 6,
  },
  subtitle: {
    ...font('medium'),
    fontSize: 15,
  },
  inlineError: {
    ...font(),
    fontSize: 15,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowTitle: {
    ...font('semibold'),
    fontSize: 16,
    flexShrink: 1,
  },
  change: {
    ...font(),
    fontSize: 15,
  },
  meta: {
    ...font(),
    fontSize: 13,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeLabel: {
    ...font('medium'),
    fontSize: 13,
  },
  footer: {
    paddingVertical: 16,
  },
});
