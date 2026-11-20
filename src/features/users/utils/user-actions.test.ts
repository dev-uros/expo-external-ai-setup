import {
  availableActions,
  canChangeAvatar,
  canSeeHistory,
} from '@/features/users/utils/user-actions';
import { makeUser } from '@/features/users/testing/fixtures';

const active = makeUser({ id: 5, name: 'Ana', surname: 'Anić' });
const pending = makeUser({ id: 6, name: 'Pera', surname: 'Perić', email_verified_at: null });
const deactivated = makeUser({
  id: 7,
  name: 'Zoran',
  surname: 'Zorić',
  deactivated_at: '2026-03-01T10:00:00+00:00',
});
const deactivatedPending = { ...pending, deactivated_at: '2026-03-01T10:00:00+00:00' };

const admin = { id: 1, isAdmin: true };
const plainUser = { id: 2, isAdmin: false };

test('a plain user may only look, own account included', () => {
  expect(availableActions(active, plainUser)).toEqual([]);
  expect(availableActions({ ...active, id: plainUser.id }, plainUser)).toEqual([]);
});

test('an admin may edit, change the role of and switch off an active account', () => {
  expect(availableActions(active, admin)).toEqual(['edit', 'changeRole', 'deactivate']);
});

test('an account never activated also offers to resend the invite', () => {
  expect(availableActions(pending, admin)).toEqual([
    'edit',
    'changeRole',
    'resendActivation',
    'deactivate',
  ]);
});

test('a switched-off account can be switched on, and is not invited until it is', () => {
  expect(availableActions(deactivated, admin)).toEqual(['edit', 'changeRole', 'reactivate']);
  expect(availableActions(deactivatedPending, admin)).toEqual(['edit', 'changeRole', 'reactivate']);
});

test('an admin may not change their own role or switch themselves off', () => {
  expect(availableActions({ ...active, id: 1 }, admin)).toEqual(['edit']);
});

test('the audit trails are for admins only', () => {
  expect(canSeeHistory(admin)).toBe(true);
  expect(canSeeHistory(plainUser)).toBe(false);
});

test('anyone changes their own picture, an admin anyone’s', () => {
  expect(canChangeAvatar({ ...active, id: 2 }, plainUser)).toBe(true);
  expect(canChangeAvatar(active, plainUser)).toBe(false);
  expect(canChangeAvatar(active, admin)).toBe(true);
});
