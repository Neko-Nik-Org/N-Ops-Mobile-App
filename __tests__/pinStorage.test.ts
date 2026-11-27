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

const mockStore: Record<string, { password: string }> = {};
let mockRefuse = false;
jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'x' },
  getGenericPassword: jest.fn(async ({ service }: { service: string }) => mockStore[service] ?? false),
  setGenericPassword: jest.fn(async (_u: string, password: string, { service }: { service: string }) => {
    if (mockRefuse) return false;
    mockStore[service] = { password };
    return true;
  }),
  resetGenericPassword: jest.fn(async ({ service }: { service: string }) => void delete mockStore[service]),
}));

import { clearPin, hasPin, LOCK_MS, MAX_TRIES, setPin, triesLeft, verifyPin, waitLeftMs } from '../src/lib/pin';

beforeEach(() => {
  for (const k of Object.keys(mockStore)) delete mockStore[k];
  mockRefuse = false;
});

describe('PIN storage', () => {
  it('re-hashes an old 10k-round record with the stronger setting after a correct PIN', async () => {
    await setPin('264810');
    const rec = JSON.parse(mockStore['nops.pin.v1'].password);
    const { pbkdf2 } = require('@noble/hashes/pbkdf2');
    const { sha256 } = require('@noble/hashes/sha256');
    const { bytesToHex, utf8ToBytes } = require('@noble/hashes/utils');
    const legacy = { salt: rec.salt, hash: bytesToHex(pbkdf2(sha256, utf8ToBytes('264810'), utf8ToBytes(rec.salt), { c: 10_000, dkLen: 32 })), fails: 0, lockedUntil: 0 };
    mockStore['nops.pin.v1'] = { password: JSON.stringify(legacy) };
    expect(await verifyPin('264810')).toEqual({ ok: true });
    const after = JSON.parse(mockStore['nops.pin.v1'].password);
    expect(after.rounds).toBeGreaterThan(10_000);
    expect(await verifyPin('264810')).toEqual({ ok: true });
  });

  it('has no PIN until one is set, and clearPin removes it', async () => {
    expect(await hasPin()).toBe(false);
    await setPin('264810');
    expect(await hasPin()).toBe(true);
    await clearPin();
    expect(await hasPin()).toBe(false);
  });

  it('stores a hash, never the PIN itself', async () => {
    await setPin('264810');
    expect(JSON.stringify(mockStore)).not.toContain('264810');
  });

  it('verifies the right PIN and counts wrong ones', async () => {
    await setPin('264810');
    expect(await verifyPin('264810')).toEqual({ ok: true });
    expect(await verifyPin('000000')).toEqual({ ok: false, reason: 'wrong', triesLeft: MAX_TRIES - 1 });
    expect(await triesLeft()).toBe(MAX_TRIES - 1);
    expect(await verifyPin('264810')).toEqual({ ok: true }); // a right PIN resets the counter
    expect(await triesLeft()).toBe(MAX_TRIES);
  });

  it('waits after too many wrong tries, even for the right PIN', async () => {
    await setPin('264810');
    for (let i = 0; i < MAX_TRIES; i++) await verifyPin('000000');
    expect(await waitLeftMs()).toBeGreaterThan(LOCK_MS - 5000);
    expect(await verifyPin('264810')).toMatchObject({ ok: false, reason: 'locked' });
  });

  it('asks to unlink when the PIN record is gone', async () => {
    expect(await verifyPin('264810')).toEqual({ ok: false, reason: 'unlink' });
  });

  it('throws when the Keychain refuses the save (so the screen never sticks)', async () => {
    mockRefuse = true;
    await expect(setPin('264810')).rejects.toThrow();
  });
});
