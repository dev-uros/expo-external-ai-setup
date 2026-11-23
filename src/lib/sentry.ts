import * as Sentry from '@sentry/react-native';
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
    environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT || 'production',
    // Internal users: the account id is enough to find the person; no IP, no headers.
    sendDefaultPii: false,
  });
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
