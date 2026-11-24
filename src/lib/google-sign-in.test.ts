const mockConfigure = jest.fn((_options?: unknown): void => {
  throw new Error('failed to determine clientID');
});
const mockSignOut = jest.fn(async () => null);

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { configure: mockConfigure, signOut: mockSignOut },
}));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  delete process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
});

function load() {
  // A fresh copy per test: the module reads the client ids once, when it is first loaded.
  return jest.requireActual<typeof import('@/lib/google-sign-in')>('@/lib/google-sign-in');
}

test('without client ids the module is never touched: no button, and signing out is safe', async () => {
  const google = load();

  expect(google.googleSignInAvailable()).toBe(false);
  await expect(google.signOutOfGoogle()).resolves.toBeUndefined();
  expect(mockConfigure).not.toHaveBeenCalled();
  expect(mockSignOut).not.toHaveBeenCalled();
});

test('on iOS the web client alone is not enough — the iOS client is needed too', () => {
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'web.apps.googleusercontent.com';

  expect(load().googleSignInAvailable()).toBe(false);
  expect(mockConfigure).not.toHaveBeenCalled();
});

test('with both ids it is configured with them and offered', () => {
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'web.apps.googleusercontent.com';
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = 'ios.apps.googleusercontent.com';
  mockConfigure.mockImplementationOnce(() => undefined);

  expect(load().googleSignInAvailable()).toBe(true);
  expect(mockConfigure).toHaveBeenCalledWith({
    webClientId: 'web.apps.googleusercontent.com',
    iosClientId: 'ios.apps.googleusercontent.com',
  });
});
