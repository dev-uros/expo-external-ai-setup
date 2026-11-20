import { fullName, userStatus } from '@/features/shared/utils/user';

const activated = '2026-01-01T10:00:00+00:00';

test('an activated account that was never switched off is active', () => {
  expect(userStatus({ deactivated_at: null, email_verified_at: activated })).toBe('active');
});

test('an account that was never activated is pending', () => {
  expect(userStatus({ deactivated_at: null, email_verified_at: null })).toBe('pending');
});

test('deactivation wins, activated or not', () => {
  expect(userStatus({ deactivated_at: activated, email_verified_at: activated })).toBe(
    'deactivated'
  );
  expect(userStatus({ deactivated_at: activated, email_verified_at: null })).toBe('deactivated');
});

test('the full name is name and surname', () => {
  expect(fullName({ name: 'Ana', surname: 'Nikolić' })).toBe('Ana Nikolić');
});
