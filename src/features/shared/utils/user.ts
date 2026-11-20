import type { User, UserRole } from '@/features/shared/schemas/user';

/** How a user's role reads in the UI. */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  user: 'Korisnik',
};

/**
 * Where an account stands. A deactivated account is not a deleted one — it stays in the list and
 * an admin can switch it back on — so the three states are shown as states, as on the web.
 */
export type UserStatus = 'active' | 'pending' | 'deactivated';

export const STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Aktivan',
  pending: 'Nije aktiviran',
  deactivated: 'Isključen',
};

/** Deactivation wins over everything; otherwise an account is active once it was activated. */
export function userStatus(user: Pick<User, 'deactivated_at' | 'email_verified_at'>): UserStatus {
  if (user.deactivated_at !== null) return 'deactivated';
  return user.email_verified_at === null ? 'pending' : 'active';
}

export function fullName(user: Pick<User, 'name' | 'surname'>): string {
  return `${user.name} ${user.surname}`;
}

/** `20. novembar 2026.` — dates read the way they are written in Serbian. */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('sr-Latn', { dateStyle: 'long' }).format(new Date(iso));
}
