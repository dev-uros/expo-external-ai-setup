import { Appearance } from 'react-native';

import { writeJson } from '@/lib/storage';
import { applyColorScheme, crossFade } from '@/lib/theme-transition';

/**
 * The saved preference is read when the store is created, so each test loads the module anew
 * after arranging what is on the "device".
 */

function loadStore() {
  let mod!: typeof import('@/features/appearance/stores/appearance');
  jest.isolateModules(() => {
    mod = jest.requireActual('@/features/appearance/stores/appearance');
  });
  return mod;
}

let setColorScheme: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  setColorScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});
  jest.requireMock<{ default: { clear: () => void } }>('expo-sqlite/kv-store').default.clear();
});

afterEach(() => jest.restoreAllMocks());

test('nothing saved: follow the system', () => {
  const { useAppearanceStore, applySavedTheme } = loadStore();

  expect(useAppearanceStore.getState().preference).toBe('system');
  applySavedTheme();
  expect(setColorScheme).toHaveBeenCalledWith('unspecified');
});

test('a saved choice is applied before anything is drawn', () => {
  writeJson('appearance.theme', 'dark');
  const { useAppearanceStore, applySavedTheme } = loadStore();

  expect(useAppearanceStore.getState().preference).toBe('dark');
  applySavedTheme();
  expect(setColorScheme).toHaveBeenCalledWith('dark');
});

test('choosing a theme applies it under a cross-fade and remembers it for the next launch', async () => {
  const first = loadStore();
  await first.useAppearanceStore.getState().setPreference('light');

  expect(crossFade).toHaveBeenCalled();
  expect(setColorScheme).toHaveBeenLastCalledWith('light');
  // Android needs the scheme pushed into every native view, not only into AppCompat.
  expect(applyColorScheme).toHaveBeenLastCalledWith('light');
  expect(loadStore().useAppearanceStore.getState().preference).toBe('light');
});

test('back to system hands the decision back to the phone', async () => {
  const { useAppearanceStore } = loadStore();
  await useAppearanceStore.getState().setPreference('dark');
  await useAppearanceStore.getState().setPreference('system');

  expect(setColorScheme).toHaveBeenLastCalledWith('unspecified');
  expect(applyColorScheme).toHaveBeenLastCalledWith('system');
});

test('picking the theme already in use does nothing — no fade for nothing', async () => {
  const { useAppearanceStore } = loadStore();
  await useAppearanceStore.getState().setPreference('system');

  expect(crossFade).not.toHaveBeenCalled();
});

test('a value this version cannot read falls back to system', () => {
  writeJson('appearance.theme', 'sepia');

  expect(loadStore().useAppearanceStore.getState().preference).toBe('system');
});
