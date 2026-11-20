import type { User } from '@/features/shared/schemas/user';

/** Accounts the users tests share — the three statuses, a picture and none. */

export function makeUser(overrides: Partial<User> & Pick<User, 'id' | 'name' | 'surname'>): User {
  return {
    email: `${overrides.name.toLowerCase()}@firma.com`,
    role: 'user',
    avatar_url: null,
    deactivated_at: null,
    email_verified_at: '2026-01-02T10:00:00+00:00',
    created_at: '2026-01-01T10:00:00+00:00',
    updated_at: '2026-01-01T10:00:00+00:00',
    ...overrides,
  };
}

export const ana = makeUser({ id: 1, name: 'Ana', surname: 'Nikolić', role: 'admin' });
export const marko = makeUser({
  id: 2,
  name: 'Marko',
  surname: 'Petrović',
  email_verified_at: null,
});
export const nikola = makeUser({
  id: 3,
  name: 'Nikola',
  surname: 'Ilić',
  deactivated_at: '2026-03-01T10:00:00+00:00',
});
