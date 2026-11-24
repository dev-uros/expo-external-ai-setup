import { uuid } from 'expo';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { readJson, writeJson } from '@/lib/storage';

/**
 * The handset the app runs on, from `expo-device` and `expo-application`. No domain knowledge:
 * the API's field names are the caller's business.
 */
export interface DeviceInfo {
  /**
   * Stable per install: Android ID (survives a reinstall), the iOS identifier for vendor (a new
   * one after a reinstall).
   */
  id: string;
  platform: 'ios' | 'android';
  /** The model — "iPhone 17 Pro", "Pixel 8". */
  name: string | null;
  osName: string | null;
  manufacturer: string | null;
  osVersion: string | null;
}

const FALLBACK_ID_KEY = 'device.fallback-id';

/**
 * iOS can answer `null` for the vendor id right after a restart, before the phone was unlocked.
 * A random id kept on the device stands in, so the phone is still one row and not a new one
 * every time.
 */
function fallbackId(): string {
  const stored = readJson(FALLBACK_ID_KEY);
  if (typeof stored === 'string') return stored;
  const id = uuid.v4();
  writeJson(FALLBACK_ID_KEY, id);
  return id;
}

async function deviceId(): Promise<string> {
  if (Platform.OS === 'android') return Application.getAndroidId();
  return (await Application.getIosIdForVendorAsync()) ?? fallbackId();
}

export async function readDeviceInfo(): Promise<DeviceInfo> {
  return {
    id: await deviceId(),
    platform: devicePlatform(),
    name: Device.modelName ?? Device.deviceName,
    osName: Device.osName,
    manufacturer: Device.manufacturer,
    osVersion: Device.osVersion,
  };
}

/** The version people see in the store — `version` in app.json, e.g. `1.2.0`. */
export function installedAppVersion(): string | null {
  return Application.nativeApplicationVersion;
}

/** The build number of the installed app (`CFBundleVersion` / `versionCode`). */
export function installedBuildVersion(): string | null {
  return Application.nativeBuildVersion;
}

/** The platform, in the API's terms. */
export function devicePlatform(): 'ios' | 'android' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}
