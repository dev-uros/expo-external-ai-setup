import { changeLanguage } from '@/lib/i18n';
import { formatDate, formatDateTime } from '@/features/shared/utils/dates';

afterEach(() => changeLanguage('sr'));

test('a date is written out in Serbian, in Latin script', () => {
  expect(formatDate('2026-11-20T12:00:00+00:00')).toMatch(/20\. novembar 2026/);
});

test('and in English once the app is switched', () => {
  changeLanguage('en');
  expect(formatDate('2026-11-20T12:00:00+00:00')).toMatch(/20 November 2026/);
});

test('a date and time carries the minute', () => {
  expect(formatDateTime('2026-11-20T12:05:00+00:00')).toMatch(/2026.*\d{1,2}:05/);
});
