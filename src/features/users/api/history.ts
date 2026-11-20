import { request } from '@/lib/http';
import { paginatedSchema } from '@/features/shared/schemas/api';
import { loginAttemptSchema, userLogSchema } from '@/features/users/schemas/history';

/**
 * The two audit trails, admin-only and paginated at 25 rows, newest first. A plain user reading
 * them would learn who looks at whose account and from where — hence admin-only.
 */

/** `GET /users/{id}/logs?page=` — what changed on this account. */
export async function fetchUserLogs(id: number, page: number) {
  return paginatedSchema(userLogSchema).parse(await request(`/users/${id}/logs?page=${page}`));
}

/** `GET /users/{id}/logins?page=` — sign-in attempts for this account, successful and not. */
export async function fetchUserLogins(id: number, page: number) {
  return paginatedSchema(loginAttemptSchema).parse(
    await request(`/users/${id}/logins?page=${page}`)
  );
}
