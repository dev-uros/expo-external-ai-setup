import { ApiError } from '@/lib/http';
import { classifySignInError } from '@/features/auth/utils/sign-in-errors';

test.each([
  [0, 'offline'],
  [403, 'blocked'],
  [404, 'no-account'],
  [409, 'use-code'],
  [422, 'rejected'],
  [429, 'wait'],
  [503, 'unavailable'],
  [500, 'other'],
] as const)('status %i means %s, whatever the message says', (status, meaning) => {
  expect(classifySignInError(new ApiError(status, 'any words at all', 'r'))).toBe(meaning);
});

test('something that is not an API error is "other"', () => {
  expect(classifySignInError(new Error('boom'))).toBe('other');
});
