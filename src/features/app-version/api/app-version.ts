import { devicePlatform } from '@/lib/device';
import { request } from '@/lib/http';
import { apiResponseSchema } from '@/features/shared/schemas/api';
import { appVersionPolicySchema } from '@/features/app-version/schemas/app-version';

/** `GET /mobile/app-version/{platform}` — public: asked before anyone signs in. */
export async function fetchAppVersionPolicy() {
  const body = await request(`/mobile/app-version/${devicePlatform()}`);
  return apiResponseSchema(appVersionPolicySchema).parse(body);
}
