import type { ErrorBoundaryProps } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { ScreenMessage } from '@/features/shared/components/screen-message';
import { backgroundColor } from '@/features/shared/utils/colors';

/**
 * What the user sees instead of a blank screen when a screen crashes while rendering. The words
 * are for the user; the error itself is for the developer, so it is shown only in development.
 *
 * Self-contained on purpose — no theme, query client or session — because the root boundary
 * renders it outside every provider.
 */
export function ErrorScreen({ error, retry }: ErrorBoundaryProps) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor }}
      contentContainerStyle={styles.fill}>
      <ScreenMessage
        icon={{ ios: 'exclamationmark.triangle', android: 'error', web: 'error' }}
        testID="error-screen"
        title="Nešto nije u redu"
        message={
          __DEV__
            ? error.message
            : 'Došlo je do neočekivane greške. Pokušajte ponovo, a ako se ponovi, javite nam.'
        }
        action={{ label: 'Pokušaj ponovo', onPress: () => void retry() }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flexGrow: 1,
  },
});
