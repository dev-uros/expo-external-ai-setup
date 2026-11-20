import { Color } from 'expo-router';
import { Platform, type ColorValue } from 'react-native';

/**
 * Semantic platform colors for React Native text and views. They follow light / dark mode and
 * the user's accessibility settings on their own — iOS system colors, Android Material You.
 */
export const labelColor = Platform.select<ColorValue>({
  ios: Color.ios.label,
  android: Color.android.dynamic.onSurface,
  default: '#000000',
});

export const secondaryLabelColor = Platform.select<ColorValue>({
  ios: Color.ios.secondaryLabel,
  android: Color.android.dynamic.onSurfaceVariant,
  default: '#3C3C43',
});

export const backgroundColor = Platform.select<ColorValue>({
  ios: Color.ios.systemBackground,
  android: Color.android.dynamic.surface,
  default: '#FFFFFF',
});
