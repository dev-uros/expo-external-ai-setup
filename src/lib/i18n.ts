import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/i18n/en.json';
import sr from '@/i18n/sr.json';

/**
 * i18next, configured for this app: Serbian (Latin script) and English, Serbian by default.
 * The phone's language is deliberately not read — the app starts in Serbian and the person
 * switches in Settings (`features/language`), which also tells the server.
 *
 * Initialised synchronously at import, with every string bundled, so the first frame is already
 * in the right language (`applySavedLanguage` runs before it). Plurals are i18next's own
 * (`_one` / `_few` / `_other` for Serbian), never hand-written rules.
 */

export const LANGUAGES = ['sr', 'en'] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'sr';

/**
 * The `Intl` locale for dates and numbers. A bare `sr` or `sr-RS` gives Cyrillic; the app writes
 * Serbian in Latin script, so it is spelled out.
 */
export const INTL_LOCALES: Record<Language, string> = {
  sr: 'sr-Latn-RS',
  en: 'en-GB',
};

export const resources = {
  sr: { translation: sr },
  en: { translation: en },
} as const;

const i18next = createInstance();

void i18next.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: LANGUAGES,
  interpolation: { escapeValue: false },
  initAsync: false,
  returnNull: false,
});

export const i18n = i18next;

/** For code that runs outside a component — the HTTP client, a toast from a mutation. */
export const t = i18next.t.bind(i18next);

export function currentLanguage(): Language {
  return (LANGUAGES as readonly string[]).includes(i18next.language)
    ? (i18next.language as Language)
    : DEFAULT_LANGUAGE;
}

export function changeLanguage(language: Language): void {
  void i18next.changeLanguage(language);
}

export function intlLocale(): string {
  return INTL_LOCALES[currentLanguage()];
}
