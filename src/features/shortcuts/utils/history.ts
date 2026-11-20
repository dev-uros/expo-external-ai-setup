import type { SymbolViewProps } from 'expo-symbols';

import type { ShortcutVisit } from '@/features/shortcuts/schemas/shortcut';

/**
 * The rules behind the shortcuts, as plain functions — the web's, for the app's own screens: what
 * is worth remembering, how a visit is folded in, and which entries surface. Kept apart from the
 * store because these are the parts worth testing.
 */

/** How many destinations are remembered. */
export const MAX_TRACKED = 24;

/** How many reach the home screen. Beyond a handful it stops being a shortcut. */
export const SHOWN = 6;

/**
 * A screen worth coming back to, read from its path. `userId` marks a screen about one person,
 * whose name only the users feature knows — the home route supplies it.
 */
export interface Destination {
  title: string;
  icon: SymbolViewProps['name'];
  userId?: number;
}

const ROUTES: { pattern: RegExp; describe: (match: RegExpMatchArray) => Destination }[] = [
  {
    pattern: /^\/users$/,
    describe: () => ({
      title: 'Korisnici',
      icon: { ios: 'person.2', android: 'group', web: 'group' },
    }),
  },
  {
    pattern: /^\/users\/(\d+)$/,
    describe: (match) => ({
      title: 'Korisnik',
      icon: { ios: 'person.crop.circle', android: 'person', web: 'person' },
      userId: Number(match[1]),
    }),
  },
  {
    pattern: /^\/users\/(\d+)\/logs$/,
    describe: (match) => ({
      title: 'Istorija izmena',
      icon: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' },
      userId: Number(match[1]),
    }),
  },
  {
    pattern: /^\/users\/(\d+)\/logins$/,
    describe: (match) => ({
      title: 'Istorija prijava',
      icon: { ios: 'person.badge.key', android: 'login', web: 'login' },
      userId: Number(match[1]),
    }),
  },
  {
    pattern: /^\/profile$/,
    describe: () => ({
      title: 'Profil',
      icon: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
    }),
  },
];

/**
 * What a path is, or `null` when it is not worth remembering: the home screen (where the
 * shortcuts are shown in the first place), forms in modals (an action, not a place), the sign-in,
 * and any path this version no longer has — an old entry is dropped, not shown as a dead link.
 */
export function describe(path: string): Destination | null {
  for (const route of ROUTES) {
    const match = path.match(route.pattern);
    if (match) return route.describe(match);
  }
  return null;
}

/** Most visited first; a tie goes to the more recent. */
export function rankVisits(history: readonly ShortcutVisit[]): ShortcutVisit[] {
  return [...history].sort(
    (a, b) => b.visits - a.visits || b.lastVisitedAt.localeCompare(a.lastVisitedAt)
  );
}

/** Counts one more visit, keeping the history ranked and at most `MAX_TRACKED` long. */
export function recordVisit(
  history: readonly ShortcutVisit[],
  path: string,
  at: Date
): ShortcutVisit[] {
  const lastVisitedAt = at.toISOString();
  const known = history.some((entry) => entry.path === path);
  const next = known
    ? history.map((entry) =>
        entry.path === path ? { ...entry, visits: entry.visits + 1, lastVisitedAt } : entry
      )
    : [...history, { path, visits: 1, lastVisitedAt }];

  return rankVisits(next).slice(0, MAX_TRACKED);
}

/** `1 poseta`, `2 posete`, `5 poseta` — and 12 to 14 stay `poseta` despite ending in 2, 3, 4. */
export function visitLabel(visits: number): string {
  const last = visits % 10;
  const lastTwo = visits % 100;
  const isFew = last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14);
  return `${visits} ${isFew ? 'posete' : 'poseta'}`;
}
