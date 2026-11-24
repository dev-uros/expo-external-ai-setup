import * as z from 'zod';

import { t } from '@/lib/i18n';
import { personNameSchema, usernameSchema } from '@/features/shared/schemas/profile-fields';

/**
 * The fields of the sign-in and registration forms, checked on the phone with the backend's own
 * rules so the common mistakes are caught at once, in the app's language. The server checks all of
 * it again and its 422 lands on the same fields — names are the API's.
 */

export const CODE_LENGTH = 6;

/**
 * How long "send again" waits when a 429 comes without a `Retry-After` header. The server's own
 * wait (`MobileOtpCode::RESEND_AFTER_SECONDS`, `retry_after`) always wins when it is there.
 */
export const RESEND_FALLBACK_SECONDS = 30;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { error: () => t('validation.email_required') })
  .pipe(z.email({ error: () => t('validation.email_invalid') }));

export const registrationProfileSchema = z.object({
  username: usernameSchema,
  first_name: personNameSchema,
  last_name: personNameSchema,
  display_personal_name: z.boolean(),
});

export type RegistrationProfile = z.infer<typeof registrationProfileSchema>;

export const REGISTRATION_FIELDS = [
  'email',
  'username',
  'first_name',
  'last_name',
  'avatar',
] as const;

/** `jovana.petrovic+test@gmail.com` → `jovana.petrovic`: a starting point the person can change. */
export function suggestUsername(email: string): string {
  const local = (email.split('@')[0]?.split('+')[0] ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '');
  return local.slice(0, 30);
}
