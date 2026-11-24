import en from '@/i18n/en.json';
import sr from '@/i18n/sr.json';

/** Every key of a nested translation file, plural forms folded into their base key. */
function keys(tree: object, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = `${prefix}${key.replace(/_(zero|one|two|few|many|other)$/, '')}`;
    return typeof value === 'object' && value !== null ? keys(value, `${path}.`) : [path];
  });
}

test('Serbian and English have the same keys', () => {
  expect([...new Set(keys(en))].sort()).toEqual([...new Set(keys(sr))].sort());
});

test('Serbian plurals have all three forms, English two', () => {
  expect(Object.keys(sr.auth.code).filter((key) => key.startsWith('resend_in_'))).toEqual([
    'resend_in_one',
    'resend_in_few',
    'resend_in_other',
  ]);
  expect(Object.keys(en.auth.code).filter((key) => key.startsWith('resend_in_'))).toEqual([
    'resend_in_one',
    'resend_in_other',
  ]);
});
