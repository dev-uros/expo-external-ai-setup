import { intlLocale } from '@/lib/i18n';

/** Dates and times in the app's language (`sr-Latn-RS` / `en-GB`), in the phone's time zone. */

/** `20. novembar 2026.` / `20 November 2026` */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(intlLocale(), { dateStyle: 'long' }).format(new Date(iso));
}

/** `20. nov 2026. 14:05` */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(intlLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso)
  );
}
