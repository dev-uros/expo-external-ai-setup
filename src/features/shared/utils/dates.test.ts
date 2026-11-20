import { formatDate, formatDateTime } from '@/features/shared/utils/dates';

test('a date is written out in Serbian', () => {
  expect(formatDate('2026-11-20T12:00:00+00:00')).toMatch(/20\. novembar 2026/);
});

test('a date and time carries the minute', () => {
  expect(formatDateTime('2026-11-20T12:05:00+00:00')).toMatch(/2026.*\d{1,2}:05/);
});
