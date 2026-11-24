import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * `app.json` holds the configuration; this file only adds what belongs to one project and not
 * to the template, read from the environment (`.env.local` locally, EAS environment variables
 * on Expo's builders). The template itself is bound to no Expo account and no Firebase project —
 * see docs/push-notifications.md for setting them up in a project made from it.
 *
 * - `APP_VARIANT`: `development`, `preview` or `production` — see VARIANTS below and
 *   docs/builds.md. `.env.local` sets `development`; each EAS build profile sets its own. Unset
 *   means `production`, so nothing that evaluates this file without a variant (an `eas update`,
 *   `eas submit`) can end up with a test app's identity.
 * - `EAS_PROJECT_ID`: the project's id at expo.dev. Without it the app cannot get an Expo push
 *   token (the profile says that sending is not set up), and over-the-air updates are off.
 * - `EXPO_OWNER`: the Expo account or organization that owns the project.
 * - `GOOGLE_SERVICES_JSON`: path to `google-services.json` (an EAS file variable on the
 *   builders); locally a `google-services.json` in the project root is picked up on its own.
 * - `SENTRY_ORG`, `SENTRY_PROJECT`: the Sentry project release builds upload source maps and
 *   debug symbols to. `SENTRY_AUTH_TOKEN` (an EAS secret) allows the upload; without all three a
 *   release build skips the upload instead of failing. See docs/sentry.md.
 */

/**
 * Three apps from one codebase, installable side by side: each variant has its own bundle id /
 * package (a phone holds one app per id), its own name under the icon, and its own URL scheme so
 * a link opens the right one. The ids in `app.json` are production's; the others add a suffix.
 */
const VARIANTS = {
  development: { idSuffix: '.dev', nameSuffix: ' (Dev)', schemeSuffix: '-dev' },
  preview: { idSuffix: '.preview', nameSuffix: ' (Test)', schemeSuffix: '-preview' },
  production: { idSuffix: '', nameSuffix: '', schemeSuffix: '' },
} as const;

export type AppVariant = keyof typeof VARIANTS;

function readVariant(): AppVariant {
  const value = process.env.APP_VARIANT || 'production';
  if (!(value in VARIANTS)) {
    throw new Error(
      `APP_VARIANT is "${value}"; expected one of: ${Object.keys(VARIANTS).join(', ')}`
    );
  }
  return value as AppVariant;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = readVariant();
  const { idSuffix, nameSuffix, schemeSuffix } = VARIANTS[variant];

  const projectId = process.env.EAS_PROJECT_ID || undefined;
  const owner = process.env.EXPO_OWNER || undefined;
  const localGoogleServices = join(__dirname, 'google-services.json');
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ||
    (existsSync(localGoogleServices) ? './google-services.json' : undefined);
  // Always applied, so every native project carries Sentry's build steps (Metro warns on each
  // start when they are missing). Uploading needs all three values; without them the build skips
  // it instead of failing. The keys are passed even when empty: the plugin warns about a key
  // that is absent, not about one that is undefined.
  const sentryOrg = process.env.SENTRY_ORG || undefined;
  const sentryProject = process.env.SENTRY_PROJECT || undefined;
  const sentryPlugin: [string, unknown] = [
    '@sentry/react-native',
    {
      organization: sentryOrg,
      project: sentryProject,
      disableAutoUpload: !(sentryOrg && sentryProject && process.env.SENTRY_AUTH_TOKEN),
    },
  ];

  const scheme = typeof config.scheme === 'string' ? config.scheme : 'expo-mobile-ai-setup';

  // iOS push goes through Apple's sandbox only for a development-signed app; a preview build
  // (ad hoc, internal distribution) is signed like production and gets production tokens.
  const apsMode = variant === 'development' ? 'development' : 'production';
  const plugins = (config.plugins ?? []).map((plugin) =>
    Array.isArray(plugin) && plugin[0] === 'expo-notifications'
      ? (['expo-notifications', { ...plugin[1], mode: apsMode }] as [string, unknown])
      : plugin
  );

  // `exp+<slug>://` is how Metro and Maestro open a development build. The slug is the same for
  // all three variants, so left to its default every variant would claim the scheme and Android
  // would ask which app should open the dev server. Only the dev app needs it.
  const devClientPlugin: [string, unknown] = [
    'expo-dev-client',
    { addGeneratedScheme: variant === 'development' },
  ];

  return {
    ...config,
    plugins: [...plugins, devClientPlugin, sentryPlugin],
    // Over-the-air updates (EAS Update, docs/updates.md). The build's channel comes from its
    // eas.json profile. Without a project id there is nowhere to fetch from: the app runs the JS
    // it was built with.
    //
    // The runtime version is the app's `version`: an update reaches only builds made from the
    // same one. A new native package or SDK upgrade means bumping `version` before the next
    // build — otherwise an update with the new JS could land in an app without its native side.
    // (`fingerprint` would detect that on its own, but it hashes the evaluated config, and this
    // one differs between Expo's builders and a laptop — Sentry token, google-services path.)
    runtimeVersion: { policy: 'appVersion' },
    updates: projectId
      ? { url: `https://u.expo.dev/${projectId}`, enabled: true }
      : { enabled: false },
    name: `${config.name ?? 'Backoffice'}${nameSuffix}`,
    // One EAS project for all three: the slug stays the same.
    slug: config.slug ?? 'expo-mobile-ai-setup',
    scheme: `${scheme}${schemeSuffix}`,
    ...(owner ? { owner } : {}),
    ios: {
      ...config.ios,
      bundleIdentifier: `${config.ios?.bundleIdentifier}${idSuffix}`,
    },
    android: {
      ...config.android,
      package: `${config.android?.package}${idSuffix}`,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
    extra: {
      ...config.extra,
      appVariant: variant,
      ...(projectId ? { eas: { ...config.extra?.eas, projectId } } : {}),
    },
  };
};
