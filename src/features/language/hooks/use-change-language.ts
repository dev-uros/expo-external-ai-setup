import { useQueryClient } from '@tanstack/react-query';

import type { Language } from '@/lib/i18n';
import { updateAccount } from '@/features/shared/api/account';
import { useSessionStore } from '@/features/shared/stores/session';
import { useLanguageStore } from '@/features/language/stores/language';

/**
 * Switching the language: the app re-renders in it at once; every query is refetched, because
 * the server translates what it sends; and a signed-in account is told, so mail and pushes follow.
 * Telling the account may fail (offline) without undoing the switch — the next request carries
 * the language anyway, and the next sign-in stores it.
 */
export function useChangeLanguage() {
  const queryClient = useQueryClient();
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  return (language: Language) => {
    if (language === useLanguageStore.getState().language) return;
    setLanguage(language);
    void queryClient.invalidateQueries();

    if (useSessionStore.getState().status === 'signedIn') {
      updateAccount({ locale: language })
        .then(({ data }) => useSessionStore.getState().replaceUser(data))
        .catch(() => undefined);
    }
  };
}
