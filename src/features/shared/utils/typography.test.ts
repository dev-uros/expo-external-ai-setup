/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { Platform } from 'react-native';

import appConfig from '../../../../app.json';
import { ANDROID_FACES, font, IOS_FACES } from '@/features/shared/utils/typography';

/**
 * `font()` names faces; the `expo-font` config plugin in `app.json` embeds them. These tests
 * keep the two in step — a weight added to one place and forgotten in the other fails here, not
 * as a silently wrong typeface on a device.
 */

const ROOT = join(__dirname, '../../../..');

const fontFiles: string[] = (() => {
  const plugin = appConfig.expo.plugins.find(
    (entry): entry is [string, { fonts: string[] }] =>
      Array.isArray(entry) && entry[0] === 'expo-font'
  );
  if (!plugin) throw new Error('expo-font plugin missing from app.json');
  return plugin[1].fonts;
})();

/** Reads the PostScript name (name ID 6) from a TrueType file's `name` table. */
function postScriptName(file: string): string {
  const data = readFileSync(join(ROOT, file));
  const tableCount = data.readUInt16BE(4);
  let nameTable = -1;
  for (let i = 0; i < tableCount; i++) {
    const record = 12 + i * 16;
    if (data.toString('ascii', record, record + 4) === 'name') {
      nameTable = data.readUInt32BE(record + 8);
    }
  }
  const count = data.readUInt16BE(nameTable + 2);
  const strings = nameTable + data.readUInt16BE(nameTable + 4);
  for (let i = 0; i < count; i++) {
    const record = nameTable + 6 + i * 12;
    const platform = data.readUInt16BE(record);
    const nameId = data.readUInt16BE(record + 6);
    if (platform !== 3 || nameId !== 6) continue;
    const length = data.readUInt16BE(record + 8);
    const offset = strings + data.readUInt16BE(record + 10);
    let name = '';
    for (let j = 0; j < length; j += 2) name += String.fromCharCode(data.readUInt16BE(offset + j));
    return name;
  }
  throw new Error(`${file} has no PostScript name`);
}

const originalOS = Platform.OS;
afterEach(() => {
  Platform.OS = originalOS;
});

test('iOS faces are exactly the PostScript names inside the embedded files', () => {
  expect(new Set(Object.values(IOS_FACES))).toEqual(new Set(fontFiles.map(postScriptName)));
});

test('Android faces are exactly the file names the plugin registers', () => {
  expect(new Set(Object.values(ANDROID_FACES))).toEqual(
    new Set(fontFiles.map((file) => basename(file, '.ttf')))
  );
});

test.each(Object.entries(IOS_FACES))('iOS: %s → %s, with no weight', (weight, face) => {
  Platform.OS = 'ios';
  expect(font(weight as keyof typeof IOS_FACES)).toEqual({ fontFamily: face });
});

test.each(Object.entries(ANDROID_FACES))('Android: %s → %s, with no weight', (weight, face) => {
  Platform.OS = 'android';
  expect(font(weight as keyof typeof ANDROID_FACES)).toEqual({ fontFamily: face });
});

test('regular is the default', () => {
  expect(font()).toEqual(font('regular'));
});
