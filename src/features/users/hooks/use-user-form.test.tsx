import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { ApiError } from '@/lib/http';
import { createUser, updateUser } from '@/features/users/api/users';
import { useUserForm } from '@/features/users/hooks/use-user-form';
import type { User } from '@/features/shared/schemas/user';
import { useSessionStore } from '@/features/shared/stores/session';

jest.mock('@/features/users/api/users', () => ({ createUser: jest.fn(), updateUser: jest.fn() }));

const updateMock = updateUser as jest.MockedFunction<typeof updateUser>;
const createMock = createUser as jest.MockedFunction<typeof createUser>;

const user: User = {
  id: 7,
  name: 'Ana',
  surname: 'Anić',
  email: 'ana@firma.com',
  role: 'admin',
  avatar_url: null,
  deactivated_at: null,
  email_verified_at: '2026-01-01T10:00:00+00:00',
  created_at: '2026-01-01T10:00:00+00:00',
  updated_at: '2026-01-01T10:00:00+00:00',
};

function wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

async function renderForm(onSaved = jest.fn()) {
  const { result } = await renderHook(() => useUserForm({ kind: 'edit', user }, onSaved), {
    wrapper,
  });
  return { form: result, onSaved };
}

beforeEach(() => {
  jest.clearAllMocks();
  useSessionStore.setState({ status: 'signedIn', user });
});

test('starts from the account as it is, with nothing to save', async () => {
  const { form } = await renderForm();

  expect(form.current.values).toEqual({
    name: 'Ana',
    surname: 'Anić',
    email: 'ana@firma.com',
    role: 'admin',
  });
  expect(form.current.isDirty).toBe(false);
});

test('only a real change counts — added spaces do not', async () => {
  const { form } = await renderForm();

  await act(() => form.current.edit('name', ' Ana '));
  expect(form.current.isDirty).toBe(false);

  await act(() => form.current.edit('name', 'Anja'));
  expect(form.current.isDirty).toBe(true);
});

test('nothing changed: saving sends nothing', async () => {
  const { form } = await renderForm();

  await act(() => {
    form.current.submit();
  });

  expect(updateMock).not.toHaveBeenCalled();
});

test('invalid input is stopped locally with Serbian messages under each field', async () => {
  const { form } = await renderForm();
  await act(() => {
    form.current.edit('name', '');
    form.current.edit('email', 'ana');
  });

  await act(() => {
    form.current.submit();
  });

  expect(updateMock).not.toHaveBeenCalled();
  expect(form.current.fieldError('name')).toBe('Unesite ime');
  expect(form.current.fieldError('email')).toBe('Unesite ispravnu email adresu');
  expect(form.current.fieldError('surname')).toBeUndefined();
});

test('editing one’s own account sends every field but the role, trimmed, and updates the session', async () => {
  const updated = { ...user, name: 'Anja', updated_at: '2026-01-02T10:00:00+00:00' };
  updateMock.mockResolvedValueOnce({ message: 'Korisnik uspešno ažuriran.', data: updated });
  const { form, onSaved } = await renderForm();
  await act(() => form.current.edit('name', ' Anja '));

  await act(() => {
    form.current.submit();
  });

  expect(updateMock).toHaveBeenCalledWith(7, {
    name: 'Anja',
    surname: 'Anić',
    email: 'ana@firma.com',
  });
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Korisnik uspešno ažuriran.'));
  expect(useSessionStore.getState().user).toEqual(updated);
});

test('a taken email lands under the email field, and what was typed stays', async () => {
  updateMock.mockRejectedValueOnce(
    new ApiError(422, 'The email has already been taken.', 'r', {
      email: ['The email has already been taken.'],
    })
  );
  const { form, onSaved } = await renderForm();
  await act(() => form.current.edit('email', 'marko@firma.com'));

  await act(() => {
    form.current.submit();
  });

  await waitFor(() =>
    expect(form.current.fieldError('email')).toBe('The email has already been taken.')
  );
  expect(form.current.formMessage).toBeNull();
  expect(form.current.values.email).toBe('marko@firma.com');
  expect(onSaved).not.toHaveBeenCalled();
  expect(useSessionStore.getState().user).toEqual(user);
});

test.each([
  [403, 'This action is unauthorized.'],
  [0, 'Server trenutno nije dostupan. Pokušajte ponovo.'],
])('a %i is shown above the form as it arrived', async (status, message) => {
  updateMock.mockRejectedValueOnce(new ApiError(status, message, 'r'));
  const { form } = await renderForm();
  await act(() => form.current.edit('surname', 'Anić-Petrović'));

  await act(() => {
    form.current.submit();
  });

  await waitFor(() => expect(form.current.formMessage).toBe(message));
  expect(form.current.values.surname).toBe('Anić-Petrović');
});

test('editing after a failed save clears the old answer', async () => {
  updateMock.mockRejectedValueOnce(new ApiError(0, 'offline', 'r'));
  const { form } = await renderForm();
  await act(() => form.current.edit('name', 'Anja'));
  await act(() => {
    form.current.submit();
  });
  await waitFor(() => expect(form.current.formMessage).toBe('offline'));

  await act(() => form.current.edit('name', 'Anja M'));

  expect(form.current.formMessage).toBeNull();
});

test('a second save while the first is pending is ignored', async () => {
  updateMock.mockReturnValueOnce(new Promise(() => {}));
  const { form } = await renderForm();
  await act(() => form.current.edit('name', 'Anja'));

  await act(() => {
    form.current.submit();
  });
  await waitFor(() => expect(form.current.isPending).toBe(true));
  await act(() => {
    form.current.submit();
  });

  expect(updateMock).toHaveBeenCalledTimes(1);
});

test('editing someone else leaves the session alone', async () => {
  useSessionStore.setState({ status: 'signedIn', user: { ...user, id: 1 } });
  updateMock.mockResolvedValueOnce({ message: 'OK', data: { ...user, name: 'Anja' } });
  const { form, onSaved } = await renderForm();
  await act(() => form.current.edit('name', 'Anja'));

  await act(() => {
    form.current.submit();
  });

  await waitFor(() => expect(onSaved).toHaveBeenCalled());
  expect(useSessionStore.getState().user?.name).toBe('Ana');
});

describe('creating', () => {
  async function renderCreate(onSaved = jest.fn()) {
    const { result } = await renderHook(() => useUserForm({ kind: 'create' }, onSaved), {
      wrapper,
    });
    return { form: result, onSaved };
  }

  test('starts empty, as a plain user', async () => {
    const { form } = await renderCreate();

    expect(form.current.values).toEqual({ name: '', surname: '', email: '', role: 'user' });
    expect(form.current.isDirty).toBe(false);
  });

  test('sends name, surname, email and role — no password', async () => {
    createMock.mockResolvedValueOnce({
      message: 'Korisnik uspešno kreiran. Poslat je email sa linkom za aktivaciju naloga.',
      data: { ...user, id: 12, email_verified_at: null },
    });
    const { form, onSaved } = await renderCreate();
    await act(() => {
      form.current.edit('name', 'Pera');
      form.current.edit('surname', 'Perić ');
      form.current.edit('email', 'pera@firma.com');
      form.current.edit('role', 'admin');
    });

    await act(() => {
      form.current.submit();
    });

    expect(createMock).toHaveBeenCalledWith({
      name: 'Pera',
      surname: 'Perić',
      email: 'pera@firma.com',
      role: 'admin',
    });
    await waitFor(() =>
      expect(onSaved).toHaveBeenCalledWith(
        'Korisnik uspešno kreiran. Poslat je email sa linkom za aktivaciju naloga.'
      )
    );
  });

  test('an empty form is stopped locally, field by field', async () => {
    const { form } = await renderCreate();
    await act(() => form.current.edit('email', 'x'));

    await act(() => {
      form.current.submit();
    });

    expect(createMock).not.toHaveBeenCalled();
    expect(form.current.fieldError('name')).toBe('Unesite ime');
    expect(form.current.fieldError('surname')).toBe('Unesite prezime');
    expect(form.current.fieldError('email')).toBe('Unesite ispravnu email adresu');
  });
});
