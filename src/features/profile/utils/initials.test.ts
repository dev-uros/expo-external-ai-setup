import { initials } from '@/features/profile/utils/initials';

test.each([
  ['Uroš', 'Minić', 'UM'],
  ['šime', 'čolić', 'ŠČ'],
  ['  ana ', ' anić', 'AA'],
  ['Đorđe', 'Žikić', 'ĐŽ'],
])('%s %s → %s', (name, surname, expected) => {
  expect(initials(name, surname)).toBe(expected);
});

test('a missing part leaves one letter rather than a placeholder', () => {
  expect(initials('Ana', '')).toBe('A');
});
