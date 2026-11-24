import { request } from '@/lib/http';
import { messageOnlySchema } from '@/features/shared/schemas/api';

/**
 * `DELETE /mobile/v1/me` — final: the personal data is erased and every phone is signed out.
 * For an Apple-linked account a fresh authorization code lets the server revoke the Apple
 * authorisation; without one the deletion still goes ahead.
 */
export async function deleteAccount(appleAuthorizationCode: string | null) {
  const body = await request('/mobile/v1/me', {
    method: 'DELETE',
    body:
      appleAuthorizationCode === null ? {} : { apple_authorization_code: appleAuthorizationCode },
  });
  return messageOnlySchema.parse(body);
}
