import type { User } from '@/features/shared/schemas/user';
import { filterUsers, normalize } from '@/features/users/utils/filter-users';

function user(id: number, name: string, surname: string, email: string): User {
  return {
    id,
    name,
    surname,
    email,
    role: 'user',
    avatar_url: null,
    deactivated_at: null,
    email_verified_at: null,
    created_at: '2026-01-01T10:00:00+00:00',
    updated_at: '2026-01-01T10:00:00+00:00',
  };
}

const users = [
  user(1, 'Ana', 'Nikolić', 'ana.nikolic@firma.com'),
  user(2, 'Saša', 'Đorđević', 'sasa@firma.com'),
  user(3, 'Nikola', 'Ilić', 'nikola.ilic@firma.com'),
];

const names = (list: User[]) => list.map((u) => u.name);

test('an empty or blank query keeps everyone, in order', () => {
  expect(names(filterUsers(users, ''))).toEqual(['Ana', 'Saša', 'Nikola']);
  expect(names(filterUsers(users, '   '))).toEqual(['Ana', 'Saša', 'Nikola']);
});

test('matches name, surname and email, ignoring case', () => {
  expect(names(filterUsers(users, 'ANA'))).toEqual(['Ana']);
  expect(names(filterUsers(users, 'ilić'))).toEqual(['Nikola']);
  expect(names(filterUsers(users, 'sasa@'))).toEqual(['Saša']);
});

test('Serbian letters can be typed without diacritics', () => {
  expect(names(filterUsers(users, 'sasa djordjevic'))).toEqual(['Saša']);
  expect(names(filterUsers(users, 'nikolic'))).toEqual(['Ana']);
});

test('every word must match, in any order', () => {
  expect(names(filterUsers(users, 'nikolić ana'))).toEqual(['Ana']);
  // "nikol" alone finds both; with "ilić" only one remains.
  expect(names(filterUsers(users, 'nikol'))).toEqual(['Ana', 'Nikola']);
  expect(names(filterUsers(users, 'nikol ilić'))).toEqual(['Nikola']);
});

test('nothing matches → nobody', () => {
  expect(filterUsers(users, 'marko')).toEqual([]);
});

test('normalize folds Serbian letters to plain Latin', () => {
  expect(normalize('ČĆŽŠĐ čćžšđ')).toBe('cczsdj cczsdj');
});
