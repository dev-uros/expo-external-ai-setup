/** Dates and times the way they are written in Serbian, in the phone's time zone. */

/** `20. novembar 2026.` */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('sr-Latn', { dateStyle: 'long' }).format(new Date(iso));
}

/** `20. nov 2026. 14:05` — for audit trails, where the minute matters. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('sr-Latn', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso)
  );
}
