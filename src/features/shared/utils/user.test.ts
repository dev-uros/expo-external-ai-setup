import { personalName } from '@/features/shared/utils/user';

test('joins whatever part of the name was given', () => {
  expect(personalName({ first_name: 'Ana', last_name: 'Anić' })).toBe('Ana Anić');
  expect(personalName({ first_name: null, last_name: 'Anić' })).toBe('Anić');
  expect(personalName({ first_name: ' ', last_name: null })).toBeNull();
});
