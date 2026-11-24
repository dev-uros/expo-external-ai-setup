import { useRef, type ComponentRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { CODE_LENGTH } from '@/features/auth/schemas/sign-in';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';

/**
 * Six boxes over one hidden text field — the field is what the keyboard, autofill and paste talk
 * to: `oneTimeCode` on iOS offers the code from Mail / Messages above the keyboard, the
 * `one-time-code` hint does the same on Android. Tapping the boxes focuses the field.
 *
 * A custom control on purpose: neither platform has a native one-time-code field.
 */
export function CodeInput({
  value,
  onChange,
  editable,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
  invalid: boolean;
}) {
  const palette = usePalette();
  const { t } = useTranslation();
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  return (
    <Pressable accessible={false} onPress={() => input.current?.focus()} style={styles.wrapper}>
      <View style={styles.row}>
        {Array.from({ length: CODE_LENGTH }, (_, index) => {
          const digit = value[index] ?? '';
          const active = index === Math.min(value.length, CODE_LENGTH - 1);
          return (
            <View
              key={index}
              style={[
                styles.cell,
                {
                  backgroundColor: palette.fieldBackground,
                  borderColor: invalid
                    ? palette.danger
                    : active
                      ? palette.avatarText
                      : palette.fieldBorder,
                },
              ]}>
              <Text style={[styles.digit, { color: palette.label }]}>{digit}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={input}
        testID="code-input"
        accessibilityLabel={t('auth.code.field')}
        value={value}
        onChangeText={onChange}
        editable={editable}
        autoFocus
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  cell: {
    flex: 1,
    maxWidth: 52,
    aspectRatio: 0.85,
    borderWidth: 1.5,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    ...font('semibold'),
    fontSize: 24,
    fontVariant: ['tabular-nums'],
  },
  // Covers the boxes and is invisible, but stays a real, focusable, accessible text field.
  hidden: {
    ...StyleSheet.absoluteFill,
    color: 'transparent',
    opacity: 0.02,
  },
});
