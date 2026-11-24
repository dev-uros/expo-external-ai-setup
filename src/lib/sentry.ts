import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import type { ComponentType } from 'react';

/**
 * Crash and error reporting. The template is bound to no Sentry account: with
 * `EXPO_PUBLIC_SENTRY_DSN` empty nothing is initialised and every function here does nothing.
 * Setting a project up: docs/sentry.md.
 *
 * Development builds never send — a red box on the developer's own screen is not an incident.
 * Release builds (`--configuration Release`, `--variant release`, EAS) do.
 */

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || undefined;

/** Called once, at module scope in the root layout, before anything can throw. */
export function initSentry(): void {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    enabled: !__DEV__,
    // The app variant (docs/builds.md): testers' errors stay apart from production's.
    environment: String(Constants.expoConfig?.extra?.appVariant ?? 'production'),
    // Internal users: the account id is enough to find the person; no IP, no headers.
    sendDefaultPii: false,
  });
  // Which JS the error came from: the one built into the app, or an over-the-air update
  // (docs/updates.md). The group id is what expo.dev lists the update under.
  Sentry.setTag('expo-is-embedded-update', String(Updates.isEmbeddedLaunch));
  if (Updates.updateId) Sentry.setTag('expo-update-id', Updates.updateId);
  const metadata =
    Updates.manifest && 'metadata' in Updates.manifest ? Updates.manifest.metadata : undefined;
  const group = metadata && 'updateGroup' in metadata ? metadata.updateGroup : undefined;
  if (typeof group === 'string') Sentry.setTag('expo-update-group-id', group);
}

/** Wraps the root component: touch breadcrumbs and the native crash handler's React side. */
export function wrapRoot<P extends Record<string, unknown>>(
  Root: ComponentType<P>
): ComponentType<P> {
  return DSN ? Sentry.wrap(Root) : Root;
}

/** Reports an error that was caught — and so would never reach Sentry's global handler. */
export function reportError(error: unknown, tags?: Record<string, string>): void {
  if (!DSN) return;
  Sentry.captureException(error, tags ? { tags } : undefined);
}

/** Who was signed in when an error happened. `null` on sign-out. */
export function setReportedUser(id: number | null): void {
  if (!DSN) return;
  Sentry.setUser(id === null ? null : { id: String(id) });
}
