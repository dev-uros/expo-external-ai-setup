import { changeLanguage, currentLanguage, intlLocale, t } from '@/lib/i18n';

afterEach(() => changeLanguage('sr'));

test('the app starts in Serbian, whatever the phone speaks', () => {
  expect(currentLanguage()).toBe('sr');
  expect(t('tabs.settings')).toBe('Podešavanja');
});

test('switching to English changes the strings and the Intl locale', () => {
  changeLanguage('en');
  expect(t('tabs.settings')).toBe('Settings');
  expect(intlLocale()).toBe('en-GB');
});

test('Serbian dates and numbers are in Latin script', () => {
  expect(intlLocale()).toBe('sr-Latn-RS');
});

test('plurals follow Serbian rules: one, few, other', () => {
  expect(t('auth.code.resend_in', { count: 1 })).toBe('Novi kod za 1 sekundu');
  expect(t('auth.code.resend_in', { count: 3 })).toBe('Novi kod za 3 sekunde');
  expect(t('auth.code.resend_in', { count: 21 })).toBe('Novi kod za 21 sekundu');
  expect(t('auth.code.resend_in', { count: 45 })).toBe('Novi kod za 45 sekundi');
});
