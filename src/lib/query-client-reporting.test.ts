import { ApiError } from '@/lib/http';
import { reportQueryError } from '@/lib/query-client';
import { reportError } from '@/lib/sentry';

/** Which failed calls reach Sentry: bugs yes, the API's answers and the phone's network no. */

beforeEach(() => {
  jest.mocked(reportError).mockClear();
});

test.each([401, 403, 404, 422])('a %i is the API answering, not reported', (status) => {
  reportQueryError(new ApiError(status, 'poruka', 'req-1'));
  expect(reportError).not.toHaveBeenCalled();
});

test('no answer at all is the network, not reported', () => {
  reportQueryError(new ApiError(0, 'Server trenutno nije dostupan.', 'req-1'));
  expect(reportError).not.toHaveBeenCalled();
});

test('a 5xx is reported with the request id that finds it in the backend log', () => {
  const error = new ApiError(500, 'Greška', 'req-500');
  reportQueryError(error);
  expect(reportError).toHaveBeenCalledWith(error, { request_id: 'req-500' });
});

test('anything that is not an ApiError — a schema mismatch, our own throw — is reported', () => {
  const error = new Error('Expected number, received string');
  reportQueryError(error);
  expect(reportError).toHaveBeenCalledWith(error);
});
