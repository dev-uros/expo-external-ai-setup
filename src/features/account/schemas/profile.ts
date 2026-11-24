import * as z from 'zod';

import { personNameSchema, usernameSchema } from '@/features/shared/schemas/profile-fields';

/** The profile form (`PATCH /mobile/v1/me`). */
export const profileSchema = z.object({
  username: usernameSchema,
  first_name: personNameSchema,
  last_name: personNameSchema,
  display_personal_name: z.boolean(),
});
