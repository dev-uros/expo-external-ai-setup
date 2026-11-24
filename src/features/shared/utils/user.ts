import type { User } from '@/features/shared/schemas/user';

/** "Ana Anić" when any part of a name was given, otherwise null. */
export function personalName(user: Pick<User, 'first_name' | 'last_name'>): string | null {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return name === '' ? null : name;
}
