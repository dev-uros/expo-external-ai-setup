import { QueryClient } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';

import { request } from '@/lib/http';
import { currentLanguage } from '@/lib/i18n';
import { readJson } from '@/lib/storage';
import { useChangeLanguage } from '@/features/language/hooks/use-change-language';
import { useLanguageStore } from '@/features/language/stores/language';
import { useSessionStore } from '@/features/shared/stores/session';
import { makeUser } from '@/features/shared/testing/fixtures';
import { queryWrapper } from '@/features/shared/testing/query-wrapper';

jest.mock('@/lib/http', () => ({ ...jest.requireActual('@/lib/http'), request: jest.fn() }));
const requestMock = request as jest.MockedFunction<typeof request>;

afterEach(() => {
  useLanguageStore.getState().setLanguage('sr');
  useSessionStore.setState({ status: 'signedOut', user: null });
  requestMock.mockReset();
});

test('switching re-renders in the new language, saves it, and refetches every query', async () => {
  const client = new QueryClient();
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  const { result } = await renderHook(() => useChangeLanguage(), { wrapper: queryWrapper(client) });

  await act(() => result.current('en'));

  expect(currentLanguage()).toBe('en');
  expect(readJson('language')).toBe('en');
  expect(invalidate).toHaveBeenCalledWith();
  // Nobody signed in: the account is not told.
  expect(requestMock).not.toHaveBeenCalled();
});

test('a signed-in account is told, so mail and pushes follow', async () => {
  useSessionStore.setState({ status: 'signedIn', user: makeUser() });
  requestMock.mockResolvedValueOnce({
    message: 'Profile saved.',
    data: makeUser({ locale: 'en' }),
  });
  const { result } = await renderHook(() => useChangeLanguage(), { wrapper: queryWrapper() });

  await act(() => result.current('en'));

  expect(requestMock).toHaveBeenCalledWith('/mobile/v1/me', {
    method: 'PATCH',
    body: { locale: 'en' },
  });
  expect(useSessionStore.getState().user?.locale).toBe('en');
});

test('a failed update does not undo the switch', async () => {
  useSessionStore.setState({ status: 'signedIn', user: makeUser() });
  requestMock.mockRejectedValueOnce(new Error('offline'));
  const { result } = await renderHook(() => useChangeLanguage(), { wrapper: queryWrapper() });

  await act(() => result.current('en'));

  expect(currentLanguage()).toBe('en');
});
