import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SegmentedControlProps } from '@/features/shared/components/segmented-control.types';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';

/**
 * A one-of-a-few choice. The app renders `segmented-control.ios.tsx` (SwiftUI) or
 * `segmented-control.android.tsx` (Compose); this file is the default Metro requires next to
 * platform files, used on no platform this app ships to. Jest runs as iOS (`jest-expo`), so
 * tests see the SwiftUI version: they assert the state behind the control, and the Maestro flows
 * press it.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: SegmentedControlProps<T>) {
  const palette = usePalette();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.row}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === option.value, disabled }}
          disabled={disabled}
          onPress={() => onChange(option.value)}
          style={[
            styles.option,
            { borderColor: palette.fieldBorder },
            value === option.value && { backgroundColor: palette.fieldBackground },
          ]}>
          <Text style={[styles.label, { color: palette.label }]}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  option: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  label: { ...font('medium'), fontSize: 15 },
});
