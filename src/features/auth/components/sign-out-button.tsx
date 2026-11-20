import { Pressable, StyleSheet, Text } from 'react-native';

import {
  SIGN_OUT_LABEL,
  SIGNING_OUT_LABEL,
  type SignOutButtonProps,
} from '@/features/auth/components/sign-out-button.types';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';

/**
 * Fallback for targets without a platform file (tests, web). iOS and Android render the native
 * SwiftUI / Compose button from `sign-out-button.ios.tsx` / `sign-out-button.android.tsx`.
 */
export function SignOutButton({ onPress, pending }: SignOutButtonProps) {
  const palette = usePalette();

  return (
    <Pressable
      role="button"
      aria-disabled={pending}
      disabled={pending}
      onPress={onPress}
      style={[styles.button, { backgroundColor: palette.dangerButton }]}>
      <Text style={styles.label}>{pending ? SIGNING_OUT_LABEL : SIGN_OUT_LABEL}</Text>
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
