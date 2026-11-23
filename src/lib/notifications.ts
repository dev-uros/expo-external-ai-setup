import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Push notifications through `expo-notifications`. No domain knowledge: what a token is sent
 * to, and when, is the caller's business.
 */

/**
 * The EAS project id an Expo push token is issued for. It exists only once the project has run
 * `eas init` — the template deliberately has not — so until then the app cannot receive pushes,
 * and says so instead of asking for a permission it could not use.
 */
export function pushProjectId(): string | null {
  const id: unknown =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

export function pushConfigured(): boolean {
  return pushProjectId() !== null;
}

/** A notification that arrives while the app is open is still shown, as a banner. */
export function showNotificationsInForeground(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export interface PushPermission {
  granted: boolean;
  /** `false` once the user refused for good — only the settings app can change it then. */
  canAskAgain: boolean;
}

export async function readPushPermission(): Promise<PushPermission> {
  const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
  return { granted, canAskAgain };
}

/**
 * Asks, if asking is still possible. Android 13+ shows the prompt only once a channel exists,
 * so the default channel is created first.
 */
export async function requestPushPermission(): Promise<PushPermission> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Obaveštenja',
      importance: AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || !current.canAskAgain) {
    return { granted: current.granted, canAskAgain: current.canAskAgain };
  }
  const { granted, canAskAgain } = await Notifications.requestPermissionsAsync();
  return { granted, canAskAgain };
}

/** `ExponentPushToken[…]` for this install, or `null` when pushes are not configured. */
export async function readExpoPushToken(): Promise<string | null> {
  const projectId = pushProjectId();
  if (projectId === null) return null;
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}
