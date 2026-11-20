import { Button, Host, Text as UIText } from '@expo/ui';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { font } from '@/features/shared/utils/typography';

interface ScreenMessageProps {
  /** An SF Symbol on iOS, a Material symbol on Android. */
  icon: SymbolViewProps['name'];
  title: string;
  message?: string;
  /** The one thing the user can do about it — try again, clear the search. */
  action?: { label: string; onPress: () => void };
  /** Names the action button for tests; its label is native text Jest cannot read. */
  testID?: string;
}

/**
 * A screen's state when there is nothing to show: it failed to load, there is nothing yet, or
 * the search matched nothing. Centered, with an icon, a sentence of explanation and at most one
 * action — a blank list or a bare error code is never the answer.
 */
export function ScreenMessage({ icon, title, message, action, testID }: ScreenMessageProps) {
  const palette = usePalette();
  return (
    <View testID={testID} style={styles.container}>
      <SymbolView name={icon} size={44} tintColor={palette.secondaryLabel} />
      <Text accessibilityRole="header" style={[styles.title, { color: palette.label }]}>
        {title}
      </Text>
      {message ? (
        <Text style={[styles.message, { color: palette.secondaryLabel }]}>{message}</Text>
      ) : null}
      {action ? (
        <Host matchContents style={styles.action}>
          <Button onPress={action.onPress} testID={testID ? `${testID}-action` : undefined}>
            <UIText textStyle={{ ...font('semibold'), fontSize: 17 }}>{action.label}</UIText>
          </Button>
        </Host>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 8,
  },
  title: {
    ...font('semibold'),
    fontSize: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  message: {
    ...font(),
    fontSize: 16,
    textAlign: 'center',
  },
  action: {
    marginTop: 12,
  },
});
