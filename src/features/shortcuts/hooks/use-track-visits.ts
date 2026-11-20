import { usePathname } from 'expo-router';
import { useEffect } from 'react';

import { useShortcutsStore } from '@/features/shortcuts/stores/shortcuts';
import { useSessionStore } from '@/features/shared/stores/session';

/**
 * Counts every screen the signed-in user lands on. Mounted once in `(app)/_layout.tsx`, so it
 * sees every navigation inside the signed-in app and nothing outside it.
 */
export function useTrackVisits() {
  const userId = useSessionStore((state) => state.user?.id);
  const pathname = usePathname();
  const load = useShortcutsStore((state) => state.load);
  const record = useShortcutsStore((state) => state.record);

  useEffect(() => {
    if (userId !== undefined) load(userId);
  }, [userId, load]);

  useEffect(() => {
    if (userId !== undefined) record(pathname);
  }, [userId, pathname, record]);
}
