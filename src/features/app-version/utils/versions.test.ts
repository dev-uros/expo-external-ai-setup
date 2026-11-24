import { isOlderThan } from '@/features/app-version/utils/versions';

describe('isOlderThan', () => {
  it.each([
    ['1.0.0', '1.0.1', true],
    ['1.9.0', '1.10.0', true],
    ['1.2', '1.2.1', true],
    ['0.9.9', '1', true],
    ['1.0.0', '1.0.0', false],
    ['1.2', '1.2.0', false],
    ['1.10.0', '1.9.0', false],
    ['2.0.0', '1.99.99', false],
  ])('%s against a minimum of %s → %s', (installed, minimum, expected) => {
    expect(isOlderThan(installed, minimum)).toBe(expected);
  });

  it.each([
    ['1.0.0', null],
    [null, '2.0.0'],
    ['1.0.0', ''],
    ['1.0.0', 'v2'],
    ['1.0.0', '2.0.0-beta'],
    ['1.0.0-beta', '2.0.0'],
  ])('lets %s run when the minimum is %s — not a version', (installed, minimum) => {
    expect(isOlderThan(installed, minimum)).toBe(false);
  });
});
