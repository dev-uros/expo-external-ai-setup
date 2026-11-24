import { devicePlatform } from '@/lib/device';
import { request } from '@/lib/http';
import { apiResponseSchema } from '@/features/shared/schemas/api';
import { appVersionPolicySchema } from '@/features/app-version/schemas/app-version';

/**
 * `GET /mobile/app-version/external/{platform}` — public: asked before anyone signs in.
 * `external` is this app; the project's internal app asks `internal`, each with its own minimum.
 */
export async function fetchAppVersionPolicy() {
  const body = await request(`/mobile/app-version/external/${devicePlatform()}`);
  return apiResponseSchema(appVersionPolicySchema).parse(body);
}
