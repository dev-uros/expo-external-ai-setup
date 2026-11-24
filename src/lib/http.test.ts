import { fetch } from 'expo/fetch';

import {
  ApiError,
  unreachableMessage,
  request,
  setAuthToken,
  setUnauthorizedHandler,
} from '@/lib/http';
import { changeLanguage } from '@/lib/i18n';

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));

const fetchMock = fetch as jest.MockedFunction<typeof fetch>;

function respond(status: number, body: unknown, headers: Record<string, string> = {}) {
  fetchMock.mockResolvedValueOnce({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
    headers: { get: (name: string) => headers[name] ?? null },
  } as unknown as Awaited<ReturnType<typeof fetch>>);
}

async function caught(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('expected the request to fail');
}

beforeEach(() => {
  fetchMock.mockReset();
  setAuthToken(null);
  setUnauthorizedHandler(null);
});

test('sends JSON with the API headers and returns the parsed body', async () => {
  respond(200, { message: 'ok', data: 1 });

  await expect(request('/auth/login', { method: 'POST', body: { a: 1 } })).resolves.toEqual({
    message: 'ok',
    data: 1,
  });

  const [url, init] = fetchMock.mock.calls[0]!;
  expect(url).toBe(`${process.env.EXPO_PUBLIC_API_URL}/auth/login`);
  expect(init?.method).toBe('POST');
  expect(init?.body).toBe('{"a":1}');
  expect(init?.headers).toMatchObject({
    Accept: 'application/json',
    'Accept-Language': 'sr',
    'Content-Type': 'application/json',
  });
  expect((init?.headers as Record<string, string>)['X-Request-Id']).toEqual(expect.any(String));
});

test('adds the bearer token once one is set', async () => {
  setAuthToken('secret');
  respond(200, {});

  await request('/auth/me');

  expect(fetchMock.mock.calls[0]![1]?.headers).toMatchObject({ Authorization: 'Bearer secret' });
});

test('turns a 422 into an ApiError with the field messages', async () => {
  respond(422, {
    message: 'The email field is required.',
    errors: { email: ['The email field is required.'] },
  });

  const error = await caught(request('/auth/login', { method: 'POST', body: {} }));

  expect(error.status).toBe(422);
  expect(error.errors).toEqual({ email: ['The email field is required.'] });
});

test('keeps the backend message verbatim', async () => {
  respond(403, { message: 'Nalog je isključen. Obratite se administratoru.' });

  const error = await caught(request('/auth/login', { method: 'POST', body: {} }));

  expect(error.status).toBe(403);
  expect(error.message).toBe('Nalog je isključen. Obratite se administratoru.');
});

test('a 401 on a request with a token reports a dead session', async () => {
  const onUnauthorized = jest.fn();
  setUnauthorizedHandler(onUnauthorized);
  setAuthToken('expired');
  respond(401, { message: 'Unauthenticated.' });

  await caught(request('/auth/me'));

  expect(onUnauthorized).toHaveBeenCalledTimes(1);
});

test('a 401 without a token is a wrong password, not a dead session', async () => {
  const onUnauthorized = jest.fn();
  setUnauthorizedHandler(onUnauthorized);
  respond(401, { message: 'Neispravni podaci za prijavu.' });

  const error = await caught(request('/auth/login', { method: 'POST', body: {} }));

  expect(error.message).toBe('Neispravni podaci za prijavu.');
  expect(onUnauthorized).not.toHaveBeenCalled();
});

test('no answer at all becomes status 0 with a message for the user', async () => {
  fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));

  const error = await caught(request('/auth/me'));

  expect(error.status).toBe(0);
  expect(error.message).toBe(unreachableMessage());
  expect(error.requestId).toEqual(expect.any(String));
});

test('a FormData body goes out as-is, with no JSON content type', async () => {
  respond(200, { message: 'ok', data: null });
  const form = new FormData();
  form.append('avatar', 'x');

  await request('/users/1/avatar', { method: 'POST', body: form });

  const init = fetchMock.mock.calls[0]![1];
  expect(init?.body).toBe(form);
  expect(init?.headers).not.toHaveProperty('Content-Type');
});

test('asks in the app language, not the phone one', async () => {
  changeLanguage('en');
  respond(200, {});

  await request('/mobile/v1/me');

  expect((fetchMock.mock.calls[0]![1]?.headers as Record<string, string>)['Accept-Language']).toBe(
    'en'
  );
  changeLanguage('sr');
});

test('carries the wait of a 429 from Retry-After', async () => {
  respond(429, { message: 'Sačekajte.' }, { 'Retry-After': '42' });

  const error = await caught(request('/mobile/v1/auth/email/sign-in-code', { method: 'POST' }));

  expect(error.status).toBe(429);
  expect(error.retryAfter).toBe(42);
});
