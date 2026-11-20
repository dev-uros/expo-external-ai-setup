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
