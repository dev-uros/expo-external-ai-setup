import {
  pushConfigured,
  readExpoPushToken,
  readPushPermission,
  requestPushPermission,
  type PushPermission,
} from '@/lib/notifications';
import { readJson, writeJson } from '@/lib/storage';
import { registerDevice } from '@/features/shared/api/device';

/** Set once the app has asked on its own after a sign-in; a device value, kept across accounts. */
const ASKED_KEY = 'notifications.asked-after-sign-in';

/**
 * The automatic prompt after signing in happens once per install. iOS shows the system prompt
 * only once anyway; Android would show it again, and asking on every launch after a "no" is
 * nagging — from then on the profile's button asks.
 */
export function shouldAskAutomatically(): boolean {
  return readJson(ASKED_KEY) !== true;
}

/**
 * Brings the permission and the server's record of this phone up to date. Runs when the signed-in
 * app mounts (a sign-in or a launch with a stored token), when the user taps "Uključi obaveštenja",
 * and when they come back from the settings app.
 *
 * `prompt` asks for permission if it can still be asked for. The permission does not depend on
 * pushes being configured: the user is asked right after signing in either way, so a project that
 * adds its EAS id later already has the answer.
 *
 * What the server is told:
 * - not allowed: the token is cleared, so nothing is sent to a phone that refused;
 * - allowed, sending configured: the current Expo token (it can change, so it is sent each time);
 * - allowed, not configured, or the token could not be read (Android without Firebase, no network
 *   to Expo): the phone is described and the stored token left alone.
 */
export async function syncPushRegistration({ prompt }: { prompt: boolean }) {
  const permission: PushPermission = prompt
    ? await requestPushPermission()
    : await readPushPermission();
  if (prompt) writeJson(ASKED_KEY, true);

  if (!permission.granted) {
    return { device: (await registerDevice(null)).data, permission };
  }

  const token = pushConfigured() ? await readExpoPushToken().catch(() => null) : null;
  return { device: (await registerDevice(token ?? undefined)).data, permission };
}
