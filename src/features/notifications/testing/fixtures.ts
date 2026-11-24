import type { Device } from '@/features/shared/schemas/device';

/** A phone as `GET /mobile/v1/device` returns it. */
export function makeDevice(overrides: Partial<Device> = {}): Device {
  return {
    id: 1,
    device_id: 'test-device-id',
    name: 'iPhone 17 Pro',
    platform: 'ios',
    operating_system: 'iOS',
    manufacturer: 'Apple',
    os_version: '27.2',
    push_notifications_enabled: false,
    signed_in: true,
    last_seen_at: '2026-11-23T10:00:00+00:00',
    created_at: '2026-11-23T10:00:00+00:00',
    ...overrides,
  };
}
