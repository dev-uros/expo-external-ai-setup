import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * The two listeners that stand in for the browser's `online` and `visibilitychange` events.
 * They are installed when the module is imported, so AppState is intercepted first and the
 * module required after; the tests then play NetInfo and AppState.
 */

let netInfoListener: (state: Pick<NetInfoState, 'isConnected'>) => void;
let appStateListener: (status: AppStateStatus) => void;

beforeAll(() => {
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    appStateListener = listener as typeof appStateListener;
    return { remove: jest.fn() } as never;
  });

  jest.requireActual('@/lib/query-client');

  netInfoListener = (NetInfo.addEventListener as jest.Mock).mock.calls.at(-1)?.[0];
});

test('losing and regaining the connection pauses and resumes queries', () => {
  netInfoListener({ isConnected: false });
  expect(onlineManager.isOnline()).toBe(false);

  netInfoListener({ isConnected: true });
  expect(onlineManager.isOnline()).toBe(true);
});

test('an unknown connection state counts as online', () => {
  netInfoListener({ isConnected: false });
  netInfoListener({ isConnected: null });
  expect(onlineManager.isOnline()).toBe(true);
});

test('the app going to the background and back is focus lost and regained', () => {
  appStateListener('background');
  expect(focusManager.isFocused()).toBe(false);

  appStateListener('active');
  expect(focusManager.isFocused()).toBe(true);
});
