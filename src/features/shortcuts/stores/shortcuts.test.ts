import { readJson } from '@/lib/storage';
import { resetAllStores } from '@/lib/zustand';
import { useShortcutsStore } from '@/features/shortcuts/stores/shortcuts';

const store = () => useShortcutsStore.getState();

beforeEach(() => {
  jest.requireMock<{ default: { clear: () => void } }>('expo-sqlite/kv-store').default.clear();
  resetAllStores();
});

test('visits are counted per account and kept on the device', () => {
  store().load(1);
  store().record('/users');
  store().record('/users/7');
  store().record('/users');

  expect(store().visits.map((visit) => [visit.path, visit.visits])).toEqual([
    ['/users', 2],
    ['/users/7', 1],
  ]);
  expect(readJson('shortcuts.1')).toHaveLength(2);
});

test('home, forms and unknown screens are not counted', () => {
  store().load(1);
  ['/', '/user-form/new', '/login', '/nowhere'].forEach((path) => store().record(path));

  expect(store().visits).toEqual([]);
});

test('nothing is counted before an account is loaded', () => {
  store().record('/users');

  expect(store().visits).toEqual([]);
});

test('signing out empties memory but not the device; the same account gets them back', () => {
  store().load(1);
  store().record('/users');

  resetAllStores();
  expect(store().visits).toEqual([]);

  store().load(1);
  expect(store().visits).toHaveLength(1);
});

test('another account on the same phone never sees them', () => {
  store().load(1);
  store().record('/users');
  resetAllStores();

  store().load(2);

  expect(store().visits).toEqual([]);
});

test('clearing forgets this account’s history on the device too', () => {
  store().load(1);
  store().record('/users');

  store().clear();

  expect(store().visits).toEqual([]);
  expect(readJson('shortcuts.1')).toBeNull();
});
