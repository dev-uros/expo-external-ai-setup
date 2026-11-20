import type { User } from '@/features/shared/schemas/user';

/**
 * Lowercased, without diacritics: `Đorđević` → `djordjevic`, `Šećerović` → `secerovic`. Phones
 * are often typed on without Serbian letters, so `sasa` must find `Saša`. `đ` has no
 * decomposition in Unicode and is mapped by hand.
 */
export function normalize(value: string): string {
  return value
    .toLocaleLowerCase('sr')
    .replaceAll('đ', 'dj')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

/**
 * Users whose name, surname or email contain every word of the query, in any order —
 * `nikolić ana` finds Ana Nikolić. An empty query keeps everyone.
 */
export function filterUsers(users: readonly User[], query: string): User[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...users];

  return users.filter((user) => {
    const haystack = normalize(`${user.name} ${user.surname} ${user.email}`);
    return words.every((word) => haystack.includes(word));
  });
}
