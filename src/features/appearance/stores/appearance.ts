import { Appearance } from 'react-native';
import * as z from 'zod';

import { readJson, writeJson } from '@/lib/storage';
import { applyColorScheme, crossFade } from '@/lib/theme-transition';
import { createDeviceStore } from '@/lib/zustand';

/**
 * The theme the user picked: follow the system, or always light or dark. It belongs to the phone, not the account, as on the web
 * (where it lives in the browser): signing out keeps it.
 *
 * It is applied with `Appearance.setColorScheme`, which overrides the whole app — React Native
 * `useColorScheme`, platform colors, the navigation theme, and the native views of `@expo/ui`,
 * alerts, menus and the keyboard alike. Nothing else needs to know about it.
 */

export const themePreferenceSchema = z.enum(['system', 'light', 'dark']);

export type ThemePreference = z.infer<typeof themePreferenceSchema>;

const STORAGE_KEY = 'appearance.theme';

function apply(preference: ThemePreference) {
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  applyColorScheme(preference);
}

/** What was saved, or `system` when nothing was — or something this version cannot read. */
function readSaved(): ThemePreference {
  const parsed = themePreferenceSchema.safeParse(readJson(STORAGE_KEY));
  return parsed.success ? parsed.data : 'system';
}

interface AppearanceState {
  preference: ThemePreference;
  /** Saves and applies the theme under a cross-fade, so no half-changed frame is ever seen. */
  setPreference: (preference: ThemePreference) => Promise<void>;
}

export const useAppearanceStore = createDeviceStore<AppearanceState>((set, get) => ({
  preference: readSaved(),
  setPreference: async (preference) => {
    if (preference === get().preference) return;
    writeJson(STORAGE_KEY, preference);
    await crossFade(() => {
      apply(preference);
      set({ preference });
    });
  },
}));

/**
 * Applies the saved theme. Called once at module scope in the root layout, before the first
 * frame — the read is synchronous, so a dark-mode user never sees a light flash.
 */
export function applySavedTheme(): void {
  apply(useAppearanceStore.getState().preference);
}
