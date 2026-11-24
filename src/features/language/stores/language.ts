import * as z from 'zod';

import { changeLanguage, DEFAULT_LANGUAGE, LANGUAGES, type Language } from '@/lib/i18n';
import { readJson, writeJson } from '@/lib/storage';
import { createDeviceStore } from '@/lib/zustand';

/**
 * The language the person picked. Serbian until they choose otherwise — the phone's language is
 * deliberately not read. It belongs to the phone, like the theme: signing out keeps it, and the
 * sign-in that follows tells the server (`Accept-Language` on every request).
 */

const STORAGE_KEY = 'language';

const languageSchema = z.enum(LANGUAGES);

/** What was saved, or the default when nothing was — or something this version cannot read. */
function readSaved(): Language {
  const parsed = languageSchema.safeParse(readJson(STORAGE_KEY));
  return parsed.success ? parsed.data : DEFAULT_LANGUAGE;
}

interface LanguageState {
  language: Language;
  /** Saves and applies it; the screens re-render in the new language at once. */
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = createDeviceStore<LanguageState>((set) => ({
  language: readSaved(),
  setLanguage: (language) => {
    writeJson(STORAGE_KEY, language);
    changeLanguage(language);
    set({ language });
  },
}));

/**
 * Applies the saved language. Called once at module scope in the root layout, before the first
 * frame — the read is synchronous, so nobody sees a screen flash in the wrong language.
 */
export function applySavedLanguage(): void {
  changeLanguage(useLanguageStore.getState().language);
}
