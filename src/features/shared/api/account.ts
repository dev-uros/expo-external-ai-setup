import { request } from '@/lib/http';
import { apiResponseSchema } from '@/features/shared/schemas/api';
import { userSchema } from '@/features/shared/schemas/user';

/**
 * Partial update of the signed-in account (`PATCH /mobile/v1/me`). Shared: the language feature
 * stores the chosen language on the account, and the account feature edits the profile.
 */
export interface AccountChanges {
  username?: string;
  first_name?: string | null;
  last_name?: string | null;
  display_personal_name?: boolean;
  locale?: 'sr' | 'en';
}

export async function updateAccount(changes: AccountChanges) {
  const body = await request('/mobile/v1/me', { method: 'PATCH', body: changes });
  return apiResponseSchema(userSchema).parse(body);
}
