import { request } from '@/lib/http';
import {
  changeUserRole,
  createUser,
  deactivateUser,
  reactivateUser,
  resendActivation,
  updateUser,
} from '@/features/users/api/users';
import { makeUser } from '@/features/users/testing/fixtures';

jest.mock('@/lib/http', () => ({ ...jest.requireActual('@/lib/http'), request: jest.fn() }));

const requestMock = request as jest.MockedFunction<typeof request>;
const user = makeUser({ id: 4, name: 'Ana', surname: 'Anić' });

beforeEach(() => {
  requestMock.mockReset();
  requestMock.mockResolvedValue({ message: 'OK', data: user });
});

const form = { name: 'Ana', surname: 'Anić', email: 'ana@firma.com' };

test.each([
  [
    'create',
    () => createUser({ ...form, role: 'user' }),
    '/users',
    'POST',
    { ...form, role: 'user' },
  ],
  ['update', () => updateUser(4, form), '/users/4', 'PUT', form],
  ['change role', () => changeUserRole(4, 'admin'), '/users/4/role', 'PUT', { role: 'admin' }],
  ['deactivate', () => deactivateUser(4), '/users/4/deactivate', 'POST', undefined],
  ['reactivate', () => reactivateUser(4), '/users/4/reactivate', 'POST', undefined],
])(
  '%s goes to the right endpoint and returns the parsed account',
  async (_name, call, path, method, body) => {
    const result = await call();

    expect(requestMock).toHaveBeenCalledWith(
      path,
      body === undefined ? { method } : { method, body }
    );
    expect(result.data).toEqual(user);
  }
);

test('resending the invite returns only the message', async () => {
  requestMock.mockResolvedValueOnce({ message: 'Aktivacioni email je ponovo poslat.', data: null });

  const result = await resendActivation(4);

  expect(requestMock).toHaveBeenCalledWith('/users/4/resend-activation', { method: 'POST' });
  expect(result.message).toBe('Aktivacioni email je ponovo poslat.');
});

test('a response that is not an account is refused, not passed on', async () => {
  requestMock.mockResolvedValueOnce({ message: 'OK', data: { id: 'x' } });

  await expect(updateUser(4, form)).rejects.toThrow();
});
