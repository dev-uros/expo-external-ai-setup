import * as z from 'zod';

import { t } from '@/lib/i18n';

/**
 * Profile fields with the backend's own rules (`MobileUserRules`), shared by registration (`auth`)
 * and the profile form (`account`). Messages are read when validation fails, so they follow the
 * app's language.
 */

/** Lower-case letters, digits, dots and underscores, 3 to 30; compared lower-cased. */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, { error: () => t('validation.username_short') })
  .max(30, { error: () => t('validation.username_long') })
  .regex(/^[a-z0-9._]+$/, { error: () => t('validation.username_format') });

/** Optional; an empty field is no name. */
export const personNameSchema = z
  .string()
  .trim()
  .max(100, { error: () => t('validation.name_long') })
  .transform((value) => (value === '' ? null : value));
