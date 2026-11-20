import { Platform } from 'react-native';

/**
 * The app's typeface, Figtree, embedded at build time by the `expo-font` config plugin in
 * `app.json` — available from the first frame, nothing to load or wait for.
 *
 * Every weight is its own face with its own name, and text selects a face by that name alone —
 * never by a family plus `fontWeight`:
 * - iOS names an embedded face by the PostScript name inside the file (`Figtree-SemiBold`).
 * - Android names it by the file name the plugin registers (`Figtree_600SemiBold`).
 *
 * The reason is `@expo/ui` on Android: its Compose text resolves a custom family to that
 * family's regular face only and ignores `fontWeight`, so "Figtree" + 600 renders as Regular.
 * Selecting the face by name is also how Expo's own Compose custom-font example does it, and it
 * works the same in React Native text, `@expo/ui` controls, headers and tab labels.
 *
 * Use `font()` for every piece of text; never write `fontFamily` or `fontWeight` by hand. A new
 * weight needs its file in the plugin config, an entry in both maps below, and a new build.
 */
export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export const IOS_FACES: Record<FontWeight, string> = {
  regular: 'Figtree-Regular',
  medium: 'Figtree-Medium',
  semibold: 'Figtree-SemiBold',
  bold: 'Figtree-Bold',
};

export const ANDROID_FACES: Record<FontWeight, string> = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
};

/** Only a family: the weight is part of the face, so there is no `fontWeight` to get wrong. */
export interface FontStyle {
  fontFamily: string;
}

export function font(weight: FontWeight = 'regular'): FontStyle {
  return { fontFamily: Platform.OS === 'ios' ? IOS_FACES[weight] : ANDROID_FACES[weight] };
}
