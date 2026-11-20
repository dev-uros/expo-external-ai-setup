import { parseUserId } from '@/features/users/schemas/route-params';

test.each([
  ['7', 7],
  ['123', 123],
])('%s is an id', (raw, id) => {
  expect(parseUserId(raw)).toBe(id);
});

test.each([undefined, '', 'abc', '0', '-3', '1.5', '7abc'])('%p is not an id', (raw) => {
  expect(parseUserId(raw)).toBeNull();
});
