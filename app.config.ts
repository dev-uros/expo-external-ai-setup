import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * `app.json` holds the configuration; this file only adds what belongs to one project and not
 * to the template, read from the environment (`.env.local` locally, EAS environment variables
 * on Expo's builders). The template itself is bound to no Expo account and no Firebase project —
 * see docs/push-notifications.md for setting them up in a project made from it.
 *
 * - `EAS_PROJECT_ID`: the project's id at expo.dev. Without it the app cannot get an Expo push
 *   token, and the profile says that sending is not set up.
 * - `EXPO_OWNER`: the Expo account or organization that owns the project.
 * - `GOOGLE_SERVICES_JSON`: path to `google-services.json` (an EAS file variable on the
 *   builders); locally a `google-services.json` in the project root is picked up on its own.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const projectId = process.env.EAS_PROJECT_ID || undefined;
  const owner = process.env.EXPO_OWNER || undefined;
  const localGoogleServices = join(__dirname, 'google-services.json');
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ||
    (existsSync(localGoogleServices) ? './google-services.json' : undefined);

  return {
    ...config,
    name: config.name ?? 'Backoffice',
    slug: config.slug ?? 'expo-mobile-ai-setup',
    ...(owner ? { owner } : {}),
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
    extra: {
      ...config.extra,
      ...(projectId ? { eas: { ...config.extra?.eas, projectId } } : {}),
    },
  };
};
