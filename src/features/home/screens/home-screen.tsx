import { Stack } from 'expo-router/stack';
import { usePalette } from '@/features/shared/hooks/use-palette';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { useSessionStore } from '@/features/shared/stores/session';
import { font } from '@/features/shared/utils/typography';

/**
 * Where a signed-in user lands: a greeting, and whatever the route places under it — the
 * shortcuts, which belong to their own feature.
 */
export function HomeScreen({ children }: { children?: ReactNode }) {
  const palette = usePalette();
  const name = useSessionStore((state) => state.user?.name);

  return (
    <>
      <Stack.Title large style={font('semibold')} largeStyle={font('bold')}>
        Početna
      </Stack.Title>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={[styles.greeting, { color: palette.label }]}>
          {name ? `Dobro došli, ${name}.` : 'Dobro došli.'}
        </Text>
        {children}
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
});
