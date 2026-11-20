import { request } from '@/lib/http';
import { updateProfile } from '@/features/profile/api/profile';

jest.mock('@/lib/http', () => ({ ...jest.requireActual('@/lib/http'), request: jest.fn() }));

const requestMock = request as jest.MockedFunction<typeof request>;

const user = {
  id: 7,
  name: 'Ana',
  surname: 'Anić',
  email: 'ana@firma.com',
  role: 'admin',
  avatar_url: null,
  deactivated_at: null,
  email_verified_at: '2026-01-01T10:00:00+00:00',
  created_at: '2026-01-01T10:00:00+00:00',
  updated_at: '2026-01-02T10:00:00+00:00',
};

test('PUTs every field to the user’s own id and returns the parsed answer', async () => {
  requestMock.mockResolvedValueOnce({ message: 'Korisnik uspešno ažuriran.', data: user });
  const form = { name: 'Ana', surname: 'Anić', email: 'ana@firma.com' };

  const result = await updateProfile(7, form);

  expect(requestMock).toHaveBeenCalledWith('/users/7', { method: 'PUT', body: form });
  expect(result).toEqual({ message: 'Korisnik uspešno ažuriran.', data: user });
});

test('an answer that is not a user is rejected, not passed on', async () => {
  requestMock.mockResolvedValueOnce({ message: 'ok', data: { id: 'x' } });

  await expect(updateProfile(7, { name: 'A', surname: 'B', email: 'a@b.co' })).rejects.toThrow();
});
