// FlashList measures its native views; under Jest it gets fixed sizes instead.
import '@shopify/flash-list/jestSetup';

// Tests never reach a real backend: the network is mocked at `@/lib/http` or `expo/fetch`.
// A fixed, obviously fake base URL keeps the suite independent of anyone's .env.local.
process.env.EXPO_PUBLIC_API_URL = 'http://api.test/api';

// The library ships its own mock; the native module does not exist under Jest.
jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest')
);

// NetInfo's native module does not exist under Jest either; its own mock reports "connected".
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js')
);

// expo-sqlite's key-value store, in memory: each test file starts with an empty device.
jest.mock('expo-sqlite/kv-store', () => {
  const values = new Map<string, string>();
  const storage = {
    getItemSync: (key: string) => values.get(key) ?? null,
    setItemSync: (key: string, value: string) => void values.set(key, value),
    removeItemSync: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
  return { __esModule: true, default: storage, Storage: storage };
});

// Our theme-transition native module does not exist under Jest: the change runs, without a fade.
jest.mock('@/lib/theme-transition', () => ({
  applyColorScheme: jest.fn(),
  crossFade: jest.fn(async (change: () => void) => change()),
}));

// The handset, fixed: expo-device and expo-application read native values Jest does not have.
jest.mock('@/lib/device', () => ({
  readDeviceInfo: jest.fn(async () => ({
    id: 'test-device-id',
    platform: 'ios',
    name: 'iPhone 17 Pro',
    osName: 'iOS',
    manufacturer: 'Apple',
    osVersion: '27.2',
  })),
  installedAppVersion: jest.fn(() => '1.0.0'),
  devicePlatform: jest.fn(() => 'ios'),
}));

// Push notifications: not configured (no EAS project), as in the template itself. A test that
// needs them configured overrides these per test.
jest.mock('@/lib/notifications', () => ({
  pushProjectId: jest.fn(() => null),
  pushConfigured: jest.fn(() => false),
  showNotificationsInForeground: jest.fn(),
  readPushPermission: jest.fn(async () => ({ granted: false, canAskAgain: true })),
  requestPushPermission: jest.fn(async () => ({ granted: false, canAskAgain: true })),
  readExpoPushToken: jest.fn(async () => null),
}));

// Sentry's SDK is native code and ESM Jest does not load; tests check what is reported, not how.
jest.mock('@/lib/sentry', () => ({
  initSentry: jest.fn(),
  wrapRoot: <T>(root: T) => root,
  reportError: jest.fn(),
  setReportedUser: jest.fn(),
}));
