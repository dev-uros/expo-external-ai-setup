const mockIsAvailable = jest.fn(async () => true);
const mockSignInAsync = jest.fn();
let mockRandomByte = 0xab;

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: mockIsAvailable,
  signInAsync: mockSignInAsync,
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));
// Native under Jest: fixed random bytes, and a stand-in hash that shows what was hashed.
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  getRandomBytes: jest.fn((length: number) => new Uint8Array(length).fill(mockRandomByte)),
  digestStringAsync: jest.fn(async (algorithm: string, value: string) => `${algorithm}(${value})`),
}));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockIsAvailable.mockResolvedValue(true);
  mockRandomByte = 0xab;
  process.env.EXPO_PUBLIC_APPLE_SIGN_IN = 'true';
});
afterAll(() => {
  delete process.env.EXPO_PUBLIC_APPLE_SIGN_IN;
});

function load() {
  // A fresh copy per test: the module reads EXPO_PUBLIC_APPLE_SIGN_IN once, when it is first loaded.
  return jest.requireActual<typeof import('@/lib/apple-sign-in')>('@/lib/apple-sign-in');
}

const credential = {
  identityToken: 'apple-id-token',
  authorizationCode: 'apple-auth-code',
  email: 'ana@privaterelay.appleid.com',
  fullName: { givenName: 'Ana', familyName: 'Anić' },
};

// Jest runs as iOS. `process.env.EXPO_OS` is compiled into the bundle, so "never on Android" is not
// something a test can switch; the Android Maestro flows show the welcome screen without the button.
describe('appleSignInAvailable', () => {
  test('not switched on for the project: no button, the system is not even asked', async () => {
    delete process.env.EXPO_PUBLIC_APPLE_SIGN_IN;

    await expect(load().appleSignInAvailable()).resolves.toBe(false);
    expect(mockIsAvailable).not.toHaveBeenCalled();
  });

  test('on iOS, switched on, it is what the system says', async () => {
    await expect(load().appleSignInAvailable()).resolves.toBe(true);

    mockIsAvailable.mockResolvedValueOnce(false);
    await expect(load().appleSignInAvailable()).resolves.toBe(false);
  });

  test('a system that fails to answer counts as no', async () => {
    mockIsAvailable.mockRejectedValueOnce(new Error('not supported'));

    await expect(load().appleSignInAvailable()).resolves.toBe(false);
  });
});

describe('signInWithApple', () => {
  test('Apple gets the SHA-256 of a fresh nonce; the raw nonce comes back for the server', async () => {
    mockSignInAsync.mockResolvedValueOnce(credential);

    const identity = await load().signInWithApple();

    const raw = 'ab'.repeat(32);
    expect(mockSignInAsync).toHaveBeenCalledWith({
      requestedScopes: [0, 1],
      nonce: `SHA-256(${raw})`,
    });
    expect(identity).toEqual({
      idToken: 'apple-id-token',
      nonce: raw,
      authorizationCode: 'apple-auth-code',
      email: 'ana@privaterelay.appleid.com',
      givenName: 'Ana',
      familyName: 'Anić',
    });
  });

  test('every attempt has its own nonce', async () => {
    mockSignInAsync.mockResolvedValue(credential);
    const apple = load();

    const first = await apple.signInWithApple();
    mockRandomByte = 0x01;
    const second = await apple.signInWithApple();

    expect(first?.nonce).toBe('ab'.repeat(32));
    expect(second?.nonce).toBe('01'.repeat(32));
  });

  test('after the first time Apple sends no name or address in the object — those are null', async () => {
    mockSignInAsync.mockResolvedValueOnce({ ...credential, email: null, fullName: null });

    const identity = await load().signInWithApple();

    expect(identity).toMatchObject({ email: null, givenName: null, familyName: null });
  });

  test('backing out of the sheet is not an error', async () => {
    mockSignInAsync.mockRejectedValueOnce(
      Object.assign(new Error('canceled'), { code: 'ERR_REQUEST_CANCELED' })
    );

    await expect(load().signInWithApple()).resolves.toBeNull();
  });

  test('any other failure is one — and so is an answer without a token', async () => {
    mockSignInAsync.mockRejectedValueOnce(
      Object.assign(new Error('failed'), { code: 'ERR_REQUEST_FAILED' })
    );
    await expect(load().signInWithApple()).rejects.toThrow('failed');

    mockSignInAsync.mockResolvedValueOnce({ ...credential, identityToken: null });
    await expect(load().signInWithApple()).rejects.toThrow('Apple returned no identity token');
  });
});
