import * as z from 'zod';

/** The two audit trails behind a user: what was changed, and who tried to sign in — admin only. */

const timestamp = z.iso.datetime({ offset: true });

/**
 * One change. `event` is a plain string, not an enum: the backend adds an event whenever a new
 * use case touches a user, and a trail that refuses to render an event this build has not heard
 * of is worse than one showing its raw name. `EVENT_LABELS` translates the known ones.
 */
export const userLogSchema = z.object({
  id: z.number().int(),
  event: z.string(),
  /** Column-level diff; both `null` for events that changed nothing, such as a resent invite. */
  old_values: z.record(z.string(), z.unknown()).nullable(),
  new_values: z.record(z.string(), z.unknown()).nullable(),
  /**
   * `null` means the system did it — a seeder, a command — not that it is unknown. Parsed as
   * `nullable`, not `nullish`: a missing key is a broken response, and silently showing "the
   * system did it" for something a person did is the one answer an audit trail must not give.
   */
  actor: z
    .object({ id: z.number().int(), name: z.string(), surname: z.string(), email: z.email() })
    .nullable(),
  ip_address: z.string().nullable(),
  created_at: timestamp,
});

export type UserLog = z.infer<typeof userLogSchema>;

export const EVENT_LABELS: Record<string, string> = {
  'user.created': 'Nalog kreiran',
  'user.updated': 'Podaci izmenjeni',
  'user.role_changed': 'Uloga promenjena',
  'user.deactivated': 'Nalog isključen',
  'user.reactivated': 'Nalog uključen',
  'user.activation_link_sent': 'Aktivacioni link poslat',
  'user.activated': 'Nalog aktiviran',
  'user.password_reset': 'Lozinka promenjena',
};

/**
 * How a sign-in attempt ended. "No such user" and "wrong password" are one outcome on purpose:
 * recording them apart would store the very distinction the login endpoint refuses to reveal.
 */
export const loginOutcomeSchema = z.enum([
  'succeeded',
  'invalid_credentials',
  'account_deactivated',
]);

export type LoginOutcome = z.infer<typeof loginOutcomeSchema>;

export const OUTCOME_LABELS: Record<LoginOutcome, string> = {
  succeeded: 'Uspešna prijava',
  invalid_credentials: 'Pogrešni podaci',
  account_deactivated: 'Nalog isključen',
};

export const loginAttemptSchema = z.object({
  id: z.number().int(),
  outcome: loginOutcomeSchema,
  /** What was typed — for a failed attempt, not necessarily this user's current address. */
  email: z.string(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: timestamp,
});

export type LoginAttempt = z.infer<typeof loginAttemptSchema>;
