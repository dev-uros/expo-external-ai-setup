import { ApiError } from '@/lib/http';
import {
  GENERIC_MESSAGE,
  NO_FEEDBACK,
  toDisplayMessage,
  toFormFeedback,
} from '@/features/shared/utils/api-errors';

const FIELDS = ['email', 'password'] as const;

test('no error, no feedback', () => {
  expect(toFormFeedback(null, FIELDS)).toBe(NO_FEEDBACK);
});

test('a 422 puts each message under the field it names and drops the summary', () => {
  const error = new ApiError(
    422,
    'The email field must be a valid email address. (and 1 more)',
    'r',
    {
      email: ['The email field must be a valid email address.'],
      password: ['The password field is required.'],
    }
  );

  expect(toFormFeedback(error, FIELDS)).toEqual({
    message: null,
    fields: {
      email: 'The email field must be a valid email address.',
      password: 'The password field is required.',
    },
  });
});

test('a message for a field that is not on screen goes above the form', () => {
  const error = new ApiError(422, 'summary', 'r', { token: ['The link has expired.'] });

  expect(toFormFeedback(error, FIELDS)).toEqual({
    message: 'The link has expired.',
    fields: {},
  });
});

test.each([
  [401, 'Neispravni podaci za prijavu.'],
  [403, 'Nalog je isključen. Obratite se administratoru.'],
  [429, 'Too Many Attempts.'],
  [0, 'Server trenutno nije dostupan. Pokušajte ponovo.'],
])('a %i is shown above the form exactly as it arrived', (status, message) => {
  expect(toFormFeedback(new ApiError(status, message, 'r'), FIELDS)).toEqual({
    message,
    fields: {},
  });
});

test('anything that is not an API error gets the generic message', () => {
  expect(toFormFeedback(new Error('boom'), FIELDS).message).toBe(GENERIC_MESSAGE);
  expect(toDisplayMessage(new Error('boom'))).toBe(GENERIC_MESSAGE);
});
