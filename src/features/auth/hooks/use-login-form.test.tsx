import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { ApiError } from '@/lib/http';
import { login } from '@/features/auth/api/session';
import { useLoginForm } from '@/features/auth/hooks/use-login-form';
import { startSession } from '@/features/auth/session';

jest.mock('@/features/auth/api/session', () => ({ login: jest.fn() }));
jest.mock('@/features/auth/session', () => ({ startSession: jest.fn() }));

const loginMock = login as jest.MockedFunction<typeof login>;

function wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

async function renderForm(values?: { email?: string; password?: string }) {
  const { result } = await renderHook(() => useLoginForm(), { wrapper });
  await act(() => {
    if (values?.email !== undefined) result.current.edit('email', values.email);
    if (values?.password !== undefined) result.current.edit('password', values.password);
  });
  return result;
}

beforeEach(() => jest.clearAllMocks());

test('an empty form is stopped locally, with a message under each field', async () => {
  const form = await renderForm();

  await act(() => {
    form.current.submit();
  });

  expect(loginMock).not.toHaveBeenCalled();
  expect(form.current.fieldError('email')).toBe('Unesite ispravnu email adresu');
  expect(form.current.fieldError('password')).toBe('Unesite lozinku');
});

test('editing a field clears its message', async () => {
  const form = await renderForm();
  await act(() => {
    form.current.submit();
  });

  await act(() => form.current.edit('email', 'a'));

  expect(form.current.fieldError('email')).toBeUndefined();
  expect(form.current.fieldError('password')).toBe('Unesite lozinku');
});

test('valid credentials are sent trimmed and start the session', async () => {
  const user = { id: 1 } as never;
  loginMock.mockResolvedValueOnce({
    message: 'Uspešno ste prijavljeni.',
    data: { user, token: 't' },
  });
  const form = await renderForm({ email: '  ana@firma.com ', password: 'password' });

  await act(() => {
    form.current.submit();
  });

  expect(loginMock).toHaveBeenCalledWith({ email: 'ana@firma.com', password: 'password' });
  await waitFor(() => expect(startSession).toHaveBeenCalledWith('t', user));
});

test.each([
  [401, 'Neispravni podaci za prijavu.'],
  [403, 'Nalog je isključen. Obratite se administratoru.'],
  [429, 'Too Many Attempts.'],
  [0, 'Server trenutno nije dostupan. Pokušajte ponovo.'],
])('a %i is shown above the form exactly as the backend wrote it', async (status, message) => {
  loginMock.mockRejectedValueOnce(new ApiError(status, message, 'r'));
  const form = await renderForm({ email: 'ana@firma.com', password: 'wrong' });

  await act(() => {
    form.current.submit();
  });

  await waitFor(() => expect(form.current.formMessage).toBe(message));
  expect(form.current.fieldError('email')).toBeUndefined();
  expect(startSession).not.toHaveBeenCalled();
});

test('a 422 from the server lands under the fields it names', async () => {
  loginMock.mockRejectedValueOnce(
    new ApiError(422, 'summary', 'r', {
      email: ['The email field must be a valid email address.'],
    })
  );
  const form = await renderForm({ email: 'ana@firma.com', password: 'x' });

  await act(() => {
    form.current.submit();
  });

  await waitFor(() =>
    expect(form.current.fieldError('email')).toBe('The email field must be a valid email address.')
  );
  expect(form.current.formMessage).toBeNull();
});

test('a second submit while the first is pending is ignored', async () => {
  loginMock.mockReturnValueOnce(new Promise(() => {}));
  const form = await renderForm({ email: 'ana@firma.com', password: 'x' });

  await act(() => {
    form.current.submit();
  });
  await waitFor(() => expect(form.current.isPending).toBe(true));
  await act(() => {
    form.current.submit();
  });

  expect(loginMock).toHaveBeenCalledTimes(1);
});
