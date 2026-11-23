import type { ErrorBoundaryProps } from 'expo-router';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ScreenMessage } from '@/features/shared/components/screen-message';
import { reportError } from '@/lib/sentry';

/**
 * What the user sees instead of a blank screen when a screen crashes while rendering. The words
 * are for the user; the error itself is for the developer, so it is shown only in development.
 *
 * Self-contained on purpose — no theme, query client or session — because the root boundary
 * renders it outside every provider.
 *
 * The boundary catches the error, so Sentry's global handler never sees it — it is reported here.
 */
export function ErrorScreen({ error, retry }: ErrorBoundaryProps) {
  const palette = usePalette();

  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: palette.background }}
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
