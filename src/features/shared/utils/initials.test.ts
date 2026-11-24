import { initials } from '@/features/shared/utils/initials';

test('the first letter, uppercased with Serbian rules', () => {
  expect(initials('šime')).toBe('Š');
  expect(initials('  ana')).toBe('A');
  expect(initials('')).toBe('');
});
