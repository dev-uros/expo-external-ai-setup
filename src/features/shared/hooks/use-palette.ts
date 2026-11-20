import { useColorScheme } from 'react-native';

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
  avatarText: '#DBEAFE',
  cardBackground: '#1C1C1E',
};

export type Palette = typeof light;

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}
