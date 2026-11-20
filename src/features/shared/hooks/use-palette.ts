import { Color } from 'expo-router';
import { Platform, useColorScheme, type ColorValue } from 'react-native';

/**
 * Text and screen colors for React Native views.
 *
 * iOS: the system's semantic colors (`label`, `secondaryLabel`, `systemBackground`). They are
 * dynamic — UIKit resolves them for the current appearance at draw time — so they follow any
 * theme change on their own.
 *
 * Android: fixed values per scheme, like the rest of this palette, on purpose. Material You's
 * `Color.android.dynamic.*` is not a live color: expo-router computes it natively, at render time,
 * from the configuration of the app's resources — which changes on another thread when the theme
 * changes in the app. A render that runs first reads the old theme, the text keeps the old
 * theme's color, and React Native never repaints it because the value it then gets is the same.
 * Plain values per scheme cannot race.
 */
function semantic(scheme: 'light' | 'dark') {
  if (Platform.OS === 'ios') {
    return {
      label: Color.ios.label as ColorValue,
      secondaryLabel: Color.ios.secondaryLabel as ColorValue,
      background: Color.ios.systemBackground as ColorValue,
    };
  }
  return scheme === 'dark'
    ? {
        label: '#E4E2E6' as ColorValue,
        secondaryLabel: '#C6C5D0' as ColorValue,
        background: '#131316' as ColorValue,
      }
    : {
        label: '#1B1B1F' as ColorValue,
        secondaryLabel: '#46464F' as ColorValue,
        background: '#FBF8FD' as ColorValue,
      };
}

/**
 * Concrete colors for places that cannot take a platform color — `@expo/ui` input borders and
 * backgrounds are translated to SwiftUI / Compose modifiers and need a plain value. React Native
 * text and views use `Color` from `expo-router` instead, which follows the system directly.
 */
const light = {
  fieldBackground: '#F2F2F7',
  fieldBorder: '#C6C6C8',
  placeholder: '#8E8E93',
  danger: '#D70015',
  /** Background of a filled destructive button — dark enough for white text in both modes. */
  dangerButton: '#D70015',
  dangerBackground: '#FFE5E7',
  avatarBackground: '#D6E4FF',
  success: '#1B6E35',
  successBackground: '#DCF5E3',
  warning: '#8A4B00',
  warningBackground: '#FFEFD6',
  avatarText: '#1D4ED8',
  cardBackground: '#FFFFFF',
};

const dark: typeof light = {
  fieldBackground: '#1C1C1E',
  fieldBorder: '#3A3A3C',
  placeholder: '#8E8E93',
  danger: '#FF6961',
  dangerButton: '#C9302C',
  dangerBackground: '#3B1214',
  avatarBackground: '#1E3A8A',
  success: '#7EE2A0',
  successBackground: '#12301D',
  warning: '#FFC56B',
  warningBackground: '#3A2604',
  avatarText: '#DBEAFE',
  cardBackground: '#1C1C1E',
};

export type Palette = typeof light & ReturnType<typeof semantic>;

const palettes = {
  light: { ...light, ...semantic('light') },
  dark: { ...dark, ...semantic('dark') },
};

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? palettes.dark : palettes.light;
}
