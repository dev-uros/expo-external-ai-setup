import { act, renderHook } from '@testing-library/react-native';

import { useCountdown } from '@/features/auth/hooks/use-countdown';

beforeEach(() => jest.useFakeTimers({ now: 1_000_000 }));
afterEach(() => jest.useRealTimers());

test('counts down a second at a time and stops at zero', async () => {
  const { result } = await renderHook(() => useCountdown(1_000_000 + 3_000));
  expect(result.current).toBe(3);

  await act(() => jest.advanceTimersByTime(1_000));
  expect(result.current).toBe(2);

  await act(() => jest.advanceTimersByTime(5_000));
  expect(result.current).toBe(0);
});

test('a moment in the past is zero at once', async () => {
  const { result } = await renderHook(() => useCountdown(0));
  expect(result.current).toBe(0);
});
