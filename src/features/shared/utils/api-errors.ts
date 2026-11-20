import { ApiError } from '@/lib/http';

/**
 * How a failed request is shown on a form.
 *
 * A 422 carries per-field messages, which belong under the fields they name. A message for a
 * field that is not on screen would tell the user nothing, so it is folded into `message`, which
 * the form renders above itself. Every other failure (401, 403, 429, no connection) is a single
 * `message`, shown as the backend wrote it.
 */
export interface FormFeedback {
  /** Shown above the form. `null` when every message found a field. */
  message: string | null;
  /** The first message per visible field, keyed by field name. */
  fields: Partial<Record<string, string>>;
}

export const NO_FEEDBACK: FormFeedback = { message: null, fields: {} };

/** Last resort: something was thrown that is not an API error at all. */
export const GENERIC_MESSAGE = 'Došlo je do neočekivane greške. Pokušajte ponovo.';

export function toFormFeedback(error: unknown, formFields: readonly string[]): FormFeedback {
  if (error === null || error === undefined) return NO_FEEDBACK;
  if (!(error instanceof ApiError)) return { message: GENERIC_MESSAGE, fields: {} };
  if (error.errors === undefined) return { message: error.message, fields: {} };

  const fields: Partial<Record<string, string>> = {};
  const orphaned: string[] = [];

  for (const [name, messages] of Object.entries(error.errors)) {
    if (formFields.includes(name)) {
      fields[name] ??= messages[0];
    } else {
      orphaned.push(...messages);
    }
  }

  const hasFieldMessages = Object.keys(fields).length > 0;
  return {
    // Laravel's own 422 `message` only restates the first field error, so it is dropped when
    // the fields carry the detail themselves.
    message: orphaned.length > 0 ? orphaned.join(' ') : hasFieldMessages ? null : error.message,
    fields,
  };
}

/** For places with no form — a banner, an alert. */
export function toDisplayMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : GENERIC_MESSAGE;
}
