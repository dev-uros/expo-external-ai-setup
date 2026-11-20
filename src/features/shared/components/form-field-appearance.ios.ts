import type { TextInputProps } from '@expo/ui';
import { background, padding, shapes, strokeBorder } from '@expo/ui/swift-ui/modifiers';

import type { Palette } from '@/features/shared/hooks/use-palette';

export const FIELD_RADIUS = 10;

/**
 * iOS: the field is drawn with SwiftUI modifiers instead of the universal `style`.
 *
 * `@expo/ui` maps `borderWidth` + `borderRadius` to SwiftUI's `border`, which always strokes a
 * plain rectangle, and then clips it to the rounded shape — the stroke's corners are cut off and
 * the outline fades out at every corner. Here the background is painted in the rounded shape and
 * the outline is `strokeBorder` along that same shape, so it stays whole.
 *
 * Order matters (each modifier wraps the previous one): padding first, so the background and the
 * outline surround it. A `TextField` already takes the full width, so no frame is needed.
 */
export function fieldAppearance(
  palette: Palette,
  invalid: boolean
): Pick<TextInputProps, 'style' | 'modifiers'> {
  const shape = shapes.roundedRectangle({ cornerRadius: FIELD_RADIUS });

  return {
    style: { width: '100%' },
    modifiers: [
      padding({ horizontal: 14, vertical: 12 }),
      background(palette.fieldBackground, shape),
      strokeBorder({
        content: invalid ? palette.danger : palette.fieldBorder,
        style: { lineWidth: 1 },
        shape: 'roundedRectangle',
        cornerRadius: FIELD_RADIUS,
      }),
    ],
  };
}
