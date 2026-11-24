import { act, renderHook } from '@testing-library/react-native';

import { request } from '@/lib/http';
import { useEditProfileForm } from '@/features/account/hooks/use-edit-profile-form';
import { useSessionStore } from '@/features/shared/stores/session';
import { makeUser } from '@/features/shared/testing/fixtures';
import { queryWrapper } from '@/features/shared/testing/query-wrapper';

jest.mock('@/lib/http', () => ({ ...jest.requireActual('@/lib/http'), request: jest.fn() }));
const requestMock = request as jest.MockedFunction<typeof request>;
const user = makeUser({ username: 'ana', first_name: 'Ana', last_name: 'Anić' });

beforeEach(() => requestMock.mockReset());

async function form(onSaved = jest.fn()) {
  return (await renderHook(() => useEditProfileForm(user, onSaved), { wrapper: queryWrapper() }))
    .result;
}

test('nothing changed: not dirty, nothing sent', async () => {
  const result = await form();

  await act(() => result.current.edit('username', ' ANA '));
  expect(result.current.isDirty).toBe(false);
  await act(() => void result.current.submit());

  expect(requestMock).not.toHaveBeenCalled();
});

test('only what changed is sent; an emptied name is null', async () => {
  const saved = makeUser({ last_name: null, display_personal_name: true });
  requestMock.mockResolvedValueOnce({ message: 'Profil je sačuvan.', data: saved });
  const onSaved = jest.fn();
  const result = await form(onSaved);

  await act(() => result.current.edit('last_name', '  '));
  await act(() => result.current.edit('display_personal_name', true));
  await act(() => void result.current.submit());

  expect(requestMock).toHaveBeenCalledWith('/mobile/v1/me', {
    method: 'PATCH',
    body: { last_name: null, display_personal_name: true },
  });
  expect(onSaved).toHaveBeenCalledWith('Profil je sačuvan.');
  expect(useSessionStore.getState().user).toEqual(saved);
});
