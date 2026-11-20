import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { AccessibilityInfo } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TOAST_VISIBLE_MS, ToastHost } from '@/features/shared/components/toast-host';
import { useToastStore } from '@/features/shared/stores/toast';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success' },
}));

const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');

/** The safe area the app gets from the router, here with an iPhone-like notch. */
const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderHost() {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastHost />
    </SafeAreaProvider>
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  useToastStore.setState({ toast: null });
});

afterEach(() => {
  jest.useRealTimers();
});

test('nothing is drawn without a toast', async () => {
  await renderHost();

  expect(screen.queryByText(/./)).not.toBeOnTheScreen();
});

test('shows the message, with a success haptic, and announces it', async () => {
  await renderHost();

  await act(() => useToastStore.getState().show('Korisnik uspešno ažuriran.'));

  expect(screen.getByText('Korisnik uspešno ažuriran.')).toBeOnTheScreen();
  expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  expect(announce).toHaveBeenCalledWith('Korisnik uspešno ažuriran.');
});

test('an info toast does not buzz', async () => {
  await renderHost();

  await act(() => useToastStore.getState().show('Sačuvano lokalno.', 'info'));

  expect(Haptics.notificationAsync).not.toHaveBeenCalled();
});

test('goes away on its own', async () => {
  await renderHost();
  await act(() => useToastStore.getState().show('Korisnik uspešno ažuriran.'));

  await act(() => jest.advanceTimersByTime(TOAST_VISIBLE_MS));

  expect(useToastStore.getState().toast).toBeNull();
});

test('a newer toast is not cut short by the older one’s timer', async () => {
  await renderHost();
  await act(() => useToastStore.getState().show('Prva'));
  await act(() => jest.advanceTimersByTime(TOAST_VISIBLE_MS - 500));

  await act(() => useToastStore.getState().show('Druga'));
  await act(() => jest.advanceTimersByTime(600));

  expect(screen.getByText('Druga')).toBeOnTheScreen();
});

test('is announced as an alert, and a tap dismisses it', async () => {
  await renderHost();
  await act(() => useToastStore.getState().show('Korisnik uspešno ažuriran.'));

  const toast = screen.getByRole('alert');
  expect(toast).toHaveTextContent('Korisnik uspešno ažuriran.');

  await fireEvent(toast, 'touchEnd');

  expect(useToastStore.getState().toast).toBeNull();
});
