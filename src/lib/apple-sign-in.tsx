import { CryptoDigestAlgorithm, digestStringAsync, getRandomBytes } from 'expo-crypto';

/**
 * Sign in with Apple (`expo-apple-authentication`), wrapped like any other library.
 *
 * Shown only on iOS, only when the project switched it on (`EXPO_PUBLIC_APPLE_SIGN_IN`, which also
 * adds the entitlement in app.config.ts) and only where the system supports it. Loaded lazily,
 * like Google.
 *
 * **Nonce:** a random value is made per attempt; Apple is handed its SHA-256, which it writes into
 * the identity token, and the raw value goes to our server, which hashes it and compares. A token
 * lifted from somewhere else was issued against a nonce the thief does not know.
 */

type AppleModule = typeof import('expo-apple-authentication');

const ENABLED = process.env.EXPO_PUBLIC_APPLE_SIGN_IN === 'true';

let loaded: AppleModule | null | undefined;

function load(): AppleModule | null {
  if (loaded !== undefined) return loaded;
  try {
    // A static import of a native module the build lacks crashes the app at start; a require
    // inside try lets the button simply not appear.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    loaded = require('expo-apple-authentication') as AppleModule;
  } catch {
    loaded = null;
  }
  return loaded;
}

export async function appleSignInAvailable(): Promise<boolean> {
  if (!ENABLED || process.env.EXPO_OS !== 'ios') return false;
  const apple = load();
  return apple !== null && (await apple.isAvailableAsync().catch(() => false));
}

export interface AppleIdentity {
  idToken: string;
  /** The raw nonce; the token carries its SHA-256. */
  nonce: string;
  authorizationCode: string | null;
  /** Apple sends the address on every sign-in in the token, but in this object only the first time. */
  email: string | null;
  /** Only on the very first authorisation — keep it, Apple never sends it again. */
  givenName: string | null;
  familyName: string | null;
}

function randomNonce(): string {
  return Array.from(getRandomBytes(32), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Opens Apple's sheet. `null` when the person backed out. */
export async function signInWithApple(): Promise<AppleIdentity | null> {
  const apple = load();
  if (apple === null) throw new Error('Sign in with Apple is not available in this build');

  const nonce = randomNonce();
  try {
    const credential = await apple.signInAsync({
      requestedScopes: [
        apple.AppleAuthenticationScope.FULL_NAME,
        apple.AppleAuthenticationScope.EMAIL,
      ],
      nonce: await digestStringAsync(CryptoDigestAlgorithm.SHA256, nonce),
    });
    if (credential.identityToken === null) throw new Error('Apple returned no identity token');

    return {
      idToken: credential.identityToken,
      nonce,
      authorizationCode: credential.authorizationCode,
      email: credential.email,
      givenName: credential.fullName?.givenName ?? null,
      familyName: credential.fullName?.familyName ?? null,
    };
  } catch (error) {
    if (isCancelled(error)) return null;
    throw error;
  }
}

function isCancelled(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'ERR_REQUEST_CANCELED'
  );
}

/**
 * Apple's own button (`ASAuthorizationAppleIDButton`) — the only approved look, localized by the
 * system. Render only when `appleSignInAvailable()` resolved true.
 */
export function AppleButton({ onPress, dark }: { onPress: () => void; dark: boolean }) {
  const apple = load();
  if (apple === null) return null;
  const {
    AppleAuthenticationButton,
    AppleAuthenticationButtonStyle,
    AppleAuthenticationButtonType,
  } = apple;

  return (
    <AppleAuthenticationButton
      testID="apple-sign-in"
      buttonType={AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={
        dark ? AppleAuthenticationButtonStyle.WHITE : AppleAuthenticationButtonStyle.BLACK
      }
      cornerRadius={12}
      onPress={onPress}
      style={{ width: '100%', height: 48 }}
    />
  );
}
