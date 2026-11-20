import { formatDateTime } from '@/features/shared/utils/dates';
import { ROLE_LABELS } from '@/features/shared/utils/user';
import { EVENT_LABELS, type UserLog } from '@/features/users/schemas/history';

/**
 * Turns a log row into something a person reads. The event carries the sentence, the diff the
 * proof. Keys come from both sides: a creation has no old values, a field cleared to `null` has
 * no new one.
 */

/** The backend's column names, in the words of the forms. Unknown columns keep their name. */
const FIELD_LABELS: Record<string, string> = {
  name: 'Ime',
  surname: 'Prezime',
  email: 'Email',
  role: 'Uloga',
  email_verified_at: 'Aktiviran',
  deactivated_at: 'Isključen',
  avatar_path: 'Profilna slika',
};

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

export function eventLabel(event: string): string {
  return EVENT_LABELS[event] ?? event;
}

/** A raw column value as text: dates formatted, roles in Serbian, nothing as a dash. */
export function displayValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (field === 'role' && (value === 'admin' || value === 'user')) return ROLE_LABELS[value];
  if (typeof value === 'string' && ISO_TIMESTAMP.test(value)) return formatDateTime(value);
  return String(value);
}

export interface FieldChange {
  field: string;
  label: string;
  from: string;
  to: string;
}

export function changedFields(log: Pick<UserLog, 'old_values' | 'new_values'>): FieldChange[] {
  const fields = new Set([
    ...Object.keys(log.new_values ?? {}),
    ...Object.keys(log.old_values ?? {}),
  ]);

  return [...fields].map((field) => ({
    field,
    label: FIELD_LABELS[field] ?? field,
    from: displayValue(field, log.old_values?.[field]),
    to: displayValue(field, log.new_values?.[field]),
  }));
}
