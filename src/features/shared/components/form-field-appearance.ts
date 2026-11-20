import type { TextInputProps } from '@expo/ui';

import type { Palette } from '@/features/shared/hooks/use-palette';

export const FIELD_RADIUS = 10;

/**
 * How a `FormField` input looks. On Android `@expo/ui` turns a rounded border into Compose
 * clips that keep the corners whole, so the universal `style` is enough. iOS has its own file.
 */
export function fieldAppearance(
  palette: Palette,
  invalid: boolean
): Pick<TextInputProps, 'style' | 'modifiers'> {
  return {
    style: {
      width: '100%',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: FIELD_RADIUS,
      borderWidth: 1,
      borderColor: invalid ? palette.danger : palette.fieldBorder,
      backgroundColor: palette.fieldBackground,
    },
  };
}
