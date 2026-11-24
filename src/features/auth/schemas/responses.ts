import * as z from 'zod';

/** `data` of `POST email/sign-in-code`. `retry_after`: seconds until another code may be asked for. */
export const codeRequestSchema = z.object({
  account_exists: z.boolean(),
  retry_after: z.number().int().nonnegative(),
});

/** `data` of `POST email/registration-code`. */
export const registrationCodeSchema = z.object({
  retry_after: z.number().int().nonnegative(),
});
