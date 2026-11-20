import * as SecureStore from 'expo-secure-store';

/**
 * Persistent storage for the bearer token — the Keychain on iOS, the Keystore-backed
 * EncryptedSharedPreferences on Android. Nothing else is persisted: the user lives in memory.
 */

const TOKEN_KEY = 'auth.token';

export function readToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function writeToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function deleteToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}
