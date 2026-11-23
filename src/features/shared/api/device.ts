import { readDeviceInfo } from '@/lib/device';
import { request } from '@/lib/http';
import { apiResponseSchema, messageOnlySchema } from '@/features/shared/schemas/api';
import { deviceSchema, type DevicePayload } from '@/features/shared/schemas/device';

/**
 * The phone this session is on. Shared because two features need it: `auth` describes the phone
 * at sign-in, `notifications` registers its push token. There is no id in these routes — the
 * bearer token is the session, and the session is the phone.
 */

/** This handset in the API's field names. */
export async function devicePayload(): Promise<DevicePayload> {
  const device = await readDeviceInfo();
  return {
    device_id: device.id,
    platform: device.platform,
    name: device.name,
    operating_system: device.osName,
    manufacturer: device.manufacturer,
    os_version: device.osVersion,
  };
}

/** `GET /auth/device` — 404 when the session registered no phone. */
export async function currentDevice() {
  const body = await request('/auth/device');
  return apiResponseSchema(deviceSchema).parse(body);
}

/**
 * `PUT /auth/device` — records this phone for the session, and refreshes `last_seen_at`.
 *
 * `pushToken` is three-state, like the API's field: `undefined` leaves the stored token alone,
 * `null` switches notifications off, a string switches them on.
 */
export async function registerDevice(pushToken?: string | null) {
  const body = await request('/auth/device', {
    method: 'PUT',
    body: {
      ...(await devicePayload()),
      ...(pushToken === undefined ? {} : { expo_push_notification_token: pushToken }),
    },
  });
  return apiResponseSchema(deviceSchema).parse(body);
}

/** `POST /auth/device/test-push` — 409 when notifications are off on this phone. */
export async function sendTestPush() {
  const body = await request('/auth/device/test-push', { method: 'POST' });
  return messageOnlySchema.parse(body);
}
