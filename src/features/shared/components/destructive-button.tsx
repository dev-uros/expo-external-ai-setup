import { Pressable, StyleSheet, Text } from 'react-native';

import type { DestructiveButtonProps } from '@/features/shared/components/destructive-button.types';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';

/**
 * Fallback for targets without a platform file (tests, web). iOS and Android render the native
 * SwiftUI / Compose button from `sign-out-button.ios.tsx` / `sign-out-button.android.tsx`.
 */
export function DestructiveButton({
  label,
  pendingLabel,
  onPress,
  pending,
  testID,
}: DestructiveButtonProps) {
  const palette = usePalette();

  return (
    <Pressable
      role="button"
      aria-disabled={pending}
      disabled={pending}
      onPress={onPress}
      testID={testID}
      style={[styles.button, { backgroundColor: palette.dangerButton }]}>
      <Text style={styles.label}>{pending ? pendingLabel : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 14,
  },
  label: {
    color: '#FFFFFF',
    ...font('semibold'),
    fontSize: 17,
  },
});
