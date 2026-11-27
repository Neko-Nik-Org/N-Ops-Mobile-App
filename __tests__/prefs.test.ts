/*
 * Copyright (C) 2026 Neko Nik <nikhil@nekonik.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * version 3 along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { defaultNotificationPrefs, defaultPrefs } from '../src/lib/prefs';

jest.mock('react-native-keychain', () => ({ ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'x' }, resetGenericPassword: jest.fn().mockResolvedValue(true) }));
jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => store[k] ?? null),
      setItem: jest.fn(async (k: string, v: string) => void (store[k] = v)),
      __reset: () => (store = {}),
    },
  };
});

const load = () => {
  let m!: typeof import('../src/lib/prefs');
  jest.isolateModules(() => {
    m = require('../src/lib/prefs');
  });
  return m;
};

beforeEach(() => (AsyncStorage as unknown as { __reset: () => void }).__reset());

describe('prefs', () => {
  it('defaults when nothing is saved', async () => {
    expect(await load().loadPrefs()).toEqual(defaultPrefs);
  });
  it('saves a patch and merges nested notification defaults on load', async () => {
    const a = load();
    await a.savePrefs({ themePref: 'dark', autoLockMs: 0 });
    const b = load(); // a fresh module reads from storage, not the cache
    const p = await b.loadPrefs();
    expect(p.themePref).toBe('dark');
    expect(p.autoLockMs).toBe(0);
    expect(p.notifications).toEqual(defaultNotificationPrefs);
  });
  it('resetAccountPrefs keeps the theme and forgets the account', async () => {
    const m = load();
    await m.savePrefs({ themePref: 'light', setupDone: true, biometricLock: true, selectedTagId: 4 });
    await m.resetAccountPrefs();
    const p = await m.loadPrefs();
    expect(p).toMatchObject({ themePref: 'light', setupDone: false, biometricLock: false, selectedTagId: null });
  });
});
