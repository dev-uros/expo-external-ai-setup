import Storage from 'expo-sqlite/kv-store';

/**
 * Small, non-secret values kept on the device — preferences, a local history — through
 * `expo-sqlite`'s key-value store. Reads are synchronous, so a preference can be applied before
 * the first frame instead of flashing the default.
 *
 * Never a token or anything personal that must be protected: that belongs in `secure-store.ts`.
 * Values are JSON; callers parse what they read with their own Zod schema, because a value
 * written by an older version of the app may no longer have the shape they expect.
 */

export function readJson(key: string): unknown {
  const raw = Storage.getItemSync(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  Storage.setItemSync(key, JSON.stringify(value));
}

export function remove(key: string): void {
  Storage.removeItemSync(key);
}
