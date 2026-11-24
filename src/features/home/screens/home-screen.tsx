import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/features/shared/hooks/use-palette';
import { useSessionStore } from '@/features/shared/stores/session';
import { toDisplayMessage } from '@/features/shared/utils/api-errors';
import { font } from '@/features/shared/utils/typography';

/**
 * Where a signed-in person lands: a greeting by the name they chose to be shown, and the place
 * the project's own content goes. Pull to refresh reads the account again — `onRefresh` comes
 * from the route, because the session is the auth feature's.
 */
export function HomeScreen({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const palette = usePalette();
  const { t } = useTranslation();
  const name = useSessionStore((state) => state.user?.display_name);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      await onRefresh();
    } catch (failure) {
      setError(toDisplayMessage(failure));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <>
      <Stack.Title large style={font('semibold')} largeStyle={font('bold')}>
        {t('tabs.home')}
      </Stack.Title>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
        }>
        <Text accessibilityRole="header" style={[styles.greeting, { color: palette.label }]}>
          {name ? t('home.greeting', { name }) : t('home.greeting_anonymous')}
        </Text>
        {error ? (
          <Text
            selectable
            accessibilityRole="alert"
            style={[styles.hint, { color: palette.danger }]}>
            {error}
          </Text>
        ) : null}
        <View style={[styles.placeholder, { borderColor: palette.fieldBorder }]}>
          <Text style={[styles.hint, { color: palette.secondaryLabel }]}>
            {t('home.placeholder')}
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 24,
  },
  greeting: {
    ...font('semibold'),
    fontSize: 22,
  },
  placeholder: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 24,
    alignItems: 'center',
  },
  hint: {
    ...font(),
    fontSize: 15,
    textAlign: 'center',
  },
});
