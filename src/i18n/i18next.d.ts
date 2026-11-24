import 'i18next';

import type sr from '@/i18n/sr.json';

/** Keys are checked against the Serbian file, so `t('typo')` fails the typecheck. */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof sr };
    returnNull: false;
  }
}
