import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text } from 'react-native';
import Animated, { Easing, FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '@/lib/i18n';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { useToastStore, type Toast } from '@/features/shared/stores/toast';
import { font } from '@/features/shared/utils/typography';

/** Long enough to read one sentence. */
export const TOAST_VISIBLE_MS = 3000;

// Expo's toast recipe: in within 300 ms, out the way it came and ~20% faster.
const EASE_OUT = Easing.out(Easing.cubic);
const ENTER = FadeInUp.duration(300).easing(EASE_OUT);
const EXIT = FadeOutUp.duration(240).easing(EASE_OUT);

/**
 * Draws the current toast at the top of the screen, below the status bar, over everything else.
 * Absolutely positioned: it never pushes the screen's content. It is an accessibility element
 * (screen readers and UI tests see it) and a tap dismisses it. Mounted once, in the root layout.
 */
export function ToastHost() {
  const toast = useToastStore((state) => state.toast);
  return toast ? <ToastView key={toast.id} toast={toast} /> : null;
}

function ToastView({ toast }: { toast: Toast }) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const hide = useToastStore((state) => state.hide);

  useEffect(() => {
    if (toast.tone === 'success') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    AccessibilityInfo.announceForAccessibility(toast.message);
    const timer = setTimeout(() => hide(toast.id), TOAST_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, hide]);

  return (
    <Animated.View
      entering={ENTER}
      exiting={EXIT}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityHint={t('common.tap_to_dismiss')}
      // A tap dismisses it, so it never sits over the header buttons longer than wanted.
      onTouchEnd={() => hide(toast.id)}
      style={[
        styles.toast,
        {
          top: insets.top + 8,
          backgroundColor:
            toast.tone === 'success' ? palette.successBackground : palette.cardBackground,
        },
      ]}>
      <Text
        style={[
          styles.text,
          { color: toast.tone === 'success' ? palette.success : palette.label },
        ]}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: {
    ...font('medium'),
    fontSize: 15,
  },
});
