import * as z from 'zod';

/**
 * The phone this session is on, as `GET` / `PUT /mobile/v1/device` return it — a row in
 * `mobile_user_devices`, keyed on the account and the phone's own id.
 */
export const deviceSchema = z.object({
  id: z.number().int(),
  device_id: z.string(),
  name: z.string().nullable(),
  platform: z.enum(['ios', 'android']),
  operating_system: z.string().nullable(),
  manufacturer: z.string().nullable(),
  os_version: z.string().nullable(),
  /** The push token itself is never sent back; whether one is stored is. */
  push_notifications_enabled: z.boolean(),
  /** Whether somebody is signed in on this phone right now. */
  signed_in: z.boolean(),
  last_seen_at: z.iso.datetime({ offset: true }),
  created_at: z.iso.datetime({ offset: true }),
});

export type Device = z.infer<typeof deviceSchema>;

/** The handset fields as the API names them — the `device` of a login, the body of the PUT. */
export const devicePayloadSchema = z.object({
  device_id: z.string().min(1),
  platform: z.enum(['ios', 'android']),
  name: z.string().nullable(),
  operating_system: z.string().nullable(),
  manufacturer: z.string().nullable(),
  os_version: z.string().nullable(),
});

export type DevicePayload = z.infer<typeof devicePayloadSchema>;
