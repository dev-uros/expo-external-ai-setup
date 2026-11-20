import { readJson, remove, writeJson } from '@/lib/storage';
import { create } from '@/lib/zustand';
import { shortcutHistorySchema, type ShortcutVisit } from '@/features/shortcuts/schemas/shortcut';
import { describe, recordVisit } from '@/features/shortcuts/utils/history';

/**
 * Which screens the signed-in account keeps coming back to — client-only state, written on
 * navigation, never fetched, so a store and not a query.
 *
 * The history follows the account. Signing out empties it from memory (this store is reset with
 * the others) but leaves it on the device, so the same person finds their shortcuts next time,
 * while someone else signing in on the same phone reads their own key and never sees them.
 */

const keyFor = (userId: number) => `shortcuts.${userId}`;

function readHistory(userId: number): ShortcutVisit[] {
  const parsed = shortcutHistorySchema.safeParse(readJson(keyFor(userId)));
  return parsed.success ? parsed.data : [];
}

interface ShortcutsState {
  userId: number | null;
  visits: ShortcutVisit[];
  /** Switches to an account's history. */
  load: (userId: number) => void;
  /** Counts a visit to `path`, if it is a place worth remembering. */
  record: (path: string) => void;
  /** Forgets this account's history, on the device as well as in memory. */
  clear: () => void;
}

export const useShortcutsStore = create<ShortcutsState>((set, get) => ({
  userId: null,
  visits: [],
  load: (userId) => {
    if (get().userId === userId) return;
    set({ userId, visits: readHistory(userId) });
  },
  record: (path) => {
    const { userId, visits } = get();
    if (userId === null || describe(path) === null) return;
    const next = recordVisit(visits, path, new Date());
    writeJson(keyFor(userId), next);
    set({ visits: next });
  },
  clear: () => {
    const { userId } = get();
    if (userId !== null) remove(keyFor(userId));
    set({ visits: [] });
  },
}));
