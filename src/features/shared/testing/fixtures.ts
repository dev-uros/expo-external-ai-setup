import type { User } from '@/features/shared/schemas/user';

/** An account as `GET /mobile/v1/me` returns it. */
export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    username: 'ana',
    first_name: 'Ana',
    last_name: 'Anić',
    display_personal_name: false,
    display_name: 'ana',
    email: 'ana@example.com',
    avatar_url: null,
    locale: 'sr',
    has_google: false,
    has_apple: false,
    created_at: '2026-01-01T10:00:00+00:00',
    ...overrides,
  };
}
