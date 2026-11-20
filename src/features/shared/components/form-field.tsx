import { Host, TextInput, type TextInputProps, type TextInputRef } from '@expo/ui';
import type { Ref } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fieldAppearance } from '@/features/shared/components/form-field-appearance';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { labelColor } from '@/features/shared/utils/colors';
import { font } from '@/features/shared/utils/typography';

interface FormFieldProps extends Omit<TextInputProps, 'style' | 'accessibilityLabel'> {
  label: string;
  /** Shown under the field and outlines it in red. */
  error?: string;
  ref?: Ref<TextInputRef>;
}

/**
 * A labelled native text field (SwiftUI `TextField` / Compose `TextField` through `@expo/ui`)
 * with its validation message underneath.
 */
export function FormField({ label, error, ref, ...input }: FormFieldProps) {
  const palette = usePalette();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <Host matchContents={{ vertical: true }} style={styles.host}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={palette.placeholder}
          {...fieldAppearance(palette, Boolean(error))}
          textStyle={{ ...font(), fontSize: 17 }}
          {...input}
        />
      </Host>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: palette.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    ...font('semibold'),
    fontSize: 15,
  },
  host: {
    width: '100%',
  },
  error: {
    ...font(),
    fontSize: 14,
  },
});
