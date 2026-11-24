/**
 * Google Sign-In (`@react-native-google-signin/google-signin`), wrapped like any other library.
 *
 * Loaded lazily: a build without the native module (an old dev build) or a project without client
 * ids simply has no Google button — the app never crashes over it. The client ids are public,
 * per project: the web client goes to Google as `webClientId`, which is what Google puts in the
 * ID token's `aud` on both platforms; the iOS client must belong to this variant's bundle id.
 */

type GoogleModule = typeof import('@react-native-google-signin/google-signin');

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined;

let loaded: GoogleModule | null | undefined;

/**
 * Both ids this platform needs. Without them the module is never even loaded: on iOS
 * `configure()` without an iOS client fails ("failed to determine clientID"), and sign-out —
 * which every session end runs — must not trip over a project that has no Google sign-in.
 */
function configured(): boolean {
  return (
    WEB_CLIENT_ID !== undefined && (process.env.EXPO_OS !== 'ios' || IOS_CLIENT_ID !== undefined)
  );
}

function load(): GoogleModule | null {
  if (loaded !== undefined) return loaded;
  if (!configured()) {
    loaded = null;
    return loaded;
  }
  try {
    // A static import of a native module the build lacks crashes the app at start; a require
    // inside try lets the button simply not appear.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    loaded = require('@react-native-google-signin/google-signin') as GoogleModule;
    loaded.GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, iosClientId: IOS_CLIENT_ID });
  } catch {
    loaded = null;
  }
  return loaded;
}

/** Whether to show the button: configured for this platform, and the native module is there. */
export function googleSignInAvailable(): boolean {
  return load() !== null;
}

export interface GoogleIdentity {
  idToken: string;
  email: string;
  givenName: string | null;
  familyName: string | null;
}

/**
 * Opens Google's account chooser. `null` when the person backed out. The previous Google session
 * is signed out first, so the chooser is always offered — otherwise the last account is reused
 * silently and a second account can never be picked.
 */
export async function signInWithGoogle(): Promise<GoogleIdentity | null> {
  const google = load();
  if (google === null) throw new Error('Google Sign-In is not available in this build');
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = google;

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    await GoogleSignin.signOut().catch(() => null);
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null;

    const { idToken, user } = response.data;
    if (idToken === null) throw new Error('Google returned no ID token — check the web client id');
    return { idToken, email: user.email, givenName: user.givenName, familyName: user.familyName };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) return null;
    throw error;
  }
}

/** Forgets the Google session on this phone, so the next person is asked which account. */
export async function signOutOfGoogle(): Promise<void> {
  const google = load();
  if (google === null) return;
  await google.GoogleSignin.signOut().catch(() => null);
}

/**
 * Google's own branded button (their guidelines require the "G" mark), full width. Render only
 * when `googleSignInAvailable()`; its text follows the phone's language, which Google controls.
 */
export function GoogleButton({
  onPress,
  disabled,
  dark,
}: {
  onPress: () => void;
  disabled: boolean;
  dark: boolean;
}) {
  const google = load();
  if (google === null) return null;
  const { GoogleSigninButton } = google;

  return (
    <GoogleSigninButton
      testID="google-sign-in"
      size={GoogleSigninButton.Size.Wide}
      color={dark ? GoogleSigninButton.Color.Dark : GoogleSigninButton.Color.Light}
      disabled={disabled}
      onPress={onPress}
      style={{ width: '100%', height: 48 }}
    />
  );
}
