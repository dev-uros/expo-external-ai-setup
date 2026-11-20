import { Stack } from 'expo-router/stack';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { useSessionStore } from '@/features/shared/stores/session';
import { labelColor, secondaryLabelColor } from '@/features/shared/utils/colors';
import { font } from '@/features/shared/utils/typography';

/** Where a signed-in user lands. A placeholder until the first real feature arrives. */
export function HomeScreen() {
  const name = useSessionStore((state) => state.user?.name);

  return (
    <>
      <Stack.Title large style={font('semibold')} largeStyle={font('bold')}>
        Početna
      </Stack.Title>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={[styles.greeting, { color: labelColor }]}>
          {name ? `Dobro došli, ${name}.` : 'Dobro došli.'}
        </Text>
        <Text style={[styles.body, { color: secondaryLabelColor }]}>
          Ovde će se pojaviti prve funkcionalnosti aplikacije.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 8,
  },
  greeting: {
    ...font('semibold'),
    fontSize: 22,
  },
  body: {
    ...font(),
    fontSize: 17,
  },
});
