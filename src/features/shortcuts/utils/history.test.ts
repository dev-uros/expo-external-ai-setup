import {
  MAX_TRACKED,
  describe as describePath,
  rankVisits,
  recordVisit,
  visitLabel,
} from '@/features/shortcuts/utils/history';

const t = (minute: number) => new Date(Date.UTC(2026, 10, 20, 10, minute));

test('the app’s places are remembered; home, forms, sign-in and unknown paths are not', () => {
  expect(describePath('/users')?.title).toBe('Korisnici');
  expect(describePath('/users/7')).toMatchObject({ title: 'Korisnik', userId: 7 });
  expect(describePath('/users/7/logs')).toMatchObject({ title: 'Istorija izmena', userId: 7 });
  expect(describePath('/users/7/logins')).toMatchObject({ title: 'Istorija prijava', userId: 7 });
  expect(describePath('/profile')?.title).toBe('Profil');

  for (const path of ['/', '/login', '/user-form/new', '/user-form/7', '/users/abc', '/old-page']) {
    expect(describePath(path)).toBeNull();
  }
});

test('a first visit is added, a repeat one counted and dated', () => {
  let history = recordVisit([], '/users', t(0));
  history = recordVisit(history, '/users/7', t(1));
  history = recordVisit(history, '/users', t(2));

  expect(history).toEqual([
    { path: '/users', visits: 2, lastVisitedAt: t(2).toISOString() },
    { path: '/users/7', visits: 1, lastVisitedAt: t(1).toISOString() },
  ]);
});

test('most visited first, and a tie goes to the more recent', () => {
  const ranked = rankVisits([
    { path: '/a', visits: 1, lastVisitedAt: t(5).toISOString() },
    { path: '/b', visits: 3, lastVisitedAt: t(1).toISOString() },
    { path: '/c', visits: 1, lastVisitedAt: t(9).toISOString() },
  ]);

  expect(ranked.map((entry) => entry.path)).toEqual(['/b', '/c', '/a']);
});

test('only so many are remembered, and the least visited drop off', () => {
  let history = recordVisit([], '/users', t(0));
  history = recordVisit(history, '/users', t(0));
  for (let id = 1; id <= MAX_TRACKED + 5; id += 1) {
    history = recordVisit(history, `/users/${id}`, t(id));
  }

  expect(history).toHaveLength(MAX_TRACKED);
  expect(history[0]?.path).toBe('/users');
});

test.each([
  [1, '1 poseta'],
  [2, '2 posete'],
  [4, '4 posete'],
  [5, '5 poseta'],
  [11, '11 poseta'],
  [12, '12 poseta'],
  [14, '14 poseta'],
  [22, '22 posete'],
  [101, '101 poseta'],
])('%i → %s', (visits, label) => {
  expect(visitLabel(visits)).toBe(label);
});
