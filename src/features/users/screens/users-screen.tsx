import AddIcon from '@expo/material-symbols/person_add.xml';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenMessage } from '@/features/shared/components/screen-message';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { toDisplayMessage } from '@/features/shared/utils/api-errors';
import { font } from '@/features/shared/utils/typography';
import { UserRow } from '@/features/users/components/user-row';
import { useViewer } from '@/features/users/hooks/use-user-actions';
import { useUsersQuery } from '@/features/users/query/use-users-query';
import { filterUsers } from '@/features/users/utils/filter-users';

/**
 * Every account, searchable — the reference for a screen that reads a list.
 *
 * It has the four states every such screen needs: loading (first fetch only), error (nothing to
 * show, with a way to retry), empty (nothing there, or nothing matching the search — two
 * different sentences) and content. A failed refresh keeps the list on screen and says so above
 * it instead of throwing the user's data away.
 */
export function UsersScreen() {
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { data: users, error, refetch } = useUsersQuery();
  const { isAdmin } = useViewer();

  // Pull to refresh shows its own spinner only for the refresh the user asked for; background
  // refetches (app back in the foreground, network back) stay silent.
  async function refresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  return (
    <>
      <Stack.Title large style={font('semibold')} largeStyle={font('bold')}>
        Korisnici
      </Stack.Title>
      {/* Creating accounts is the admin's; a plain user does not see the button at all. */}
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          hidden={!isAdmin}
          icon={process.env.EXPO_OS === 'ios' ? 'plus' : AddIcon}
          accessibilityLabel="Novi korisnik"
          onPress={() => router.push('/user-form/new')}
        />
      </Stack.Toolbar>
      <Stack.SearchBar
        placeholder="Pretraži po imenu ili emailu"
        autoCapitalize="none"
        // Always in view, as in Contacts: on a list of people, search is the main way in.
        hideWhenScrolling={false}
        inputType="email"
        onChangeText={(event) => setSearch(event.nativeEvent.text)}
        onCancelButtonPress={() => setSearch('')}
      />

      {users === undefined ? (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.fill}>
          {error ? (
            <ScreenMessage
              icon={{ ios: 'wifi.exclamationmark', android: 'cloud_off', web: 'cloud_off' }}
              testID="users-load-error"
              title="Korisnici nisu učitani"
              message={toDisplayMessage(error)}
              action={{ label: 'Pokušaj ponovo', onPress: () => void refetch() }}
            />
          ) : (
            <View style={styles.loading}>
              <ActivityIndicator size="large" accessibilityLabel="Učitavanje korisnika" />
            </View>
          )}
        </ScrollView>
      ) : (
        <FlashList
          data={filterUsers(users, search)}
          keyExtractor={(user) => String(user.id)}
          renderItem={({ item }) => <UserRow user={item} />}
          ItemSeparatorComponent={Separator}
          ListHeaderComponent={
            error ? <RefreshFailed message={toDisplayMessage(error)} onRetry={refresh} /> : null
          }
          ListEmptyComponent={
            search.trim() ? (
              <ScreenMessage
                icon={{ ios: 'magnifyingglass', android: 'search_off', web: 'search_off' }}
                title="Nema rezultata"
                message={`Nijedan korisnik ne odgovara pretrazi „${search.trim()}”.`}
              />
            ) : (
              <ScreenMessage
                icon={{ ios: 'person.2', android: 'group', web: 'group' }}
                title="Još nema korisnika"
              />
            )
          }
          refreshing={refreshing}
          onRefresh={refresh}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        />
      )}
    </>
  );
}

function Separator() {
  const palette = usePalette();
  return <View style={[styles.separator, { backgroundColor: palette.fieldBorder }]} />;
}

/** Above the stale list when a refresh failed: what happened, and a way to try again. */
function RefreshFailed({ message, onRetry }: { message: string; onRetry: () => void }) {
  const palette = usePalette();

  return (
    <View
      accessible
      accessibilityRole="alert"
      style={[styles.refreshFailed, { backgroundColor: palette.dangerBackground }]}>
      <Text style={[styles.refreshFailedText, { color: palette.danger }]}>
        {`Osvežavanje nije uspelo: ${message}`}
      </Text>
      <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={8}>
        <Text style={[styles.retry, { color: palette.danger }]}>Pokušaj ponovo</Text>
      </Pressable>
    </View>
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
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
  },
  refreshFailed: {
    margin: 16,
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  refreshFailedText: {
    ...font(),
    fontSize: 15,
  },
  retry: {
    ...font('semibold'),
    fontSize: 15,
  },
});
