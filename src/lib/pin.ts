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

import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';
import * as Keychain from 'react-native-keychain';

/**
 * The phone PIN. It only unlocks this phone and never goes to the server.
 * Stored as a salted hash in the Keychain/Keystore (this device only), next to the wrong-try counter,
 * so closing or force-quitting the app doesn't reset the counter.
 */

export const PIN_LENGTH = 6;
/** Wrong tries in a row before the wait. */
export const MAX_TRIES = 3;
/** The wait after every MAX_TRIES wrong tries. */
export const LOCK_MS = 5 * 60 * 1000;
/** After this many waits in a row (9 wrong in total) the phone unlinks itself. */
export const MAX_ROUNDS = 3;
/** Auto-lock choices in Profile; the first is the default. */
export const AUTO_LOCK_OPTIONS = [
  { label: '1 min', ms: 60_000 },
  { label: 'Immediately', ms: 0 },
  { label: '5 min', ms: 300_000 },
  { label: '15 min', ms: 900_000 },
] as const;

// shortcut: 50k rounds of PBKDF2-SHA256 in JS (a 310k-round native one would take seconds in Hermes);
// the Keychain, the try counter and the wait are the real protection. Upgrade to a native KDF.
const ROUNDS = 50_000;
/** Records saved before `rounds` was stored used this many. */
const LEGACY_ROUNDS = 10_000;

const KEY = 'nops.pin.v1';
const opts = { service: KEY, accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

/** Why a PIN is refused when creating one, or null if it's fine. */
export function weakPinReason(pin: string): string | null {
  const digits = pin.split('').map(Number);
  if (new Set(digits).size <= 2) return 'repeats the same digits';
  const steps = digits.slice(1).map((d, i) => d - digits[i]);
  if (steps.every((s) => s === 1) || steps.every((s) => s === -1)) return 'is a straight run';
  if (/^(\d)\1(\d)\2(\d)\3$/.test(pin)) return 'is pairs of digits'; // 112233
  if (pin.slice(0, 3) === pin.slice(3) || pin.slice(0, 3) === pin.slice(3).split('').reverse().join('')) return 'is a repeated pattern'; // 123123, 123321
  if (/^(\d\d)\1\1$/.test(pin)) return 'is a repeated pattern'; // 121212
  if (['159753', '147258', '369258', '258369', '147369', '135790', '246810', '131313', '520520'].includes(pin)) return 'is a common PIN';
  return null;
}

interface PinRecord {
  salt: string;
  hash: string;
  /** PBKDF2 rounds used for `hash`; absent on records from before this was stored. */
  rounds?: number;
  /** Wrong tries since the last correct PIN. */
  fails: number;
  /** Epoch ms; 0 when not waiting. */
  lockedUntil: number;
}

const hashOf = (pin: string, salt: string, rounds = LEGACY_ROUNDS) => bytesToHex(pbkdf2(sha256, utf8ToBytes(pin), utf8ToBytes(salt), { c: rounds, dkLen: 32 }));

function same(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export type Attempt =
  | { ok: true }
  | { ok: false; reason: 'wrong'; triesLeft: number }
  | { ok: false; reason: 'locked'; waitMs: number }
  | { ok: false; reason: 'unlink' };

/** The try/wait rules, as a pure step so they can be tested. `matches` = the typed PIN was right. */
export function nextAttempt(rec: PinRecord, matches: boolean, now: number): { rec: PinRecord; result: Attempt } {
  if (rec.lockedUntil > now) return { rec, result: { ok: false, reason: 'locked', waitMs: rec.lockedUntil - now } };
  if (matches) return { rec: { ...rec, fails: 0, lockedUntil: 0 }, result: { ok: true } };
  const fails = rec.fails + 1;
  if (fails >= MAX_TRIES * MAX_ROUNDS) return { rec: { ...rec, fails }, result: { ok: false, reason: 'unlink' } };
  if (fails % MAX_TRIES === 0) {
    // shortcut: the wait uses the phone's clock, so changing the date skips it; fine for a lock on one's own phone.
    return { rec: { ...rec, fails, lockedUntil: now + LOCK_MS }, result: { ok: false, reason: 'locked', waitMs: LOCK_MS } };
  }
  return { rec: { ...rec, fails }, result: { ok: false, reason: 'wrong', triesLeft: MAX_TRIES - (fails % MAX_TRIES) } };
}

async function read(): Promise<PinRecord | null> {
  try {
    const c = await Keychain.getGenericPassword({ service: KEY });
    return c ? (JSON.parse(c.password) as PinRecord) : null;
  } catch {
    return null;
  }
}

const write = async (r: PinRecord) => {
  // setGenericPassword answers `false` (not an error) when the Keychain refuses, e.g. no device passcode.
  if (!(await Keychain.setGenericPassword('pin', JSON.stringify(r), opts))) throw new Error('Keychain refused to save the PIN');
};

export async function hasPin(): Promise<boolean> {
  return (await read()) !== null;
}

export async function setPin(pin: string): Promise<void> {
  // The salt only has to be unique, not secret, so no secure random source is needed.
  const salt = bytesToHex(sha256(utf8ToBytes(`${Date.now()}.${Math.random()}.${Math.random()}`))).slice(0, 32);
  await write({ salt, hash: hashOf(pin, salt, ROUNDS), rounds: ROUNDS, fails: 0, lockedUntil: 0 });
}

export async function clearPin(): Promise<void> {
  await Keychain.resetGenericPassword({ service: KEY }).catch(() => undefined);
}

/** Milliseconds left in the wait after too many wrong PINs (0 = not waiting). */
export async function waitLeftMs(): Promise<number> {
  return Math.max(0, ((await read())?.lockedUntil ?? 0) - Date.now());
}

/** Tries left before the next wait. */
export async function triesLeft(): Promise<number> {
  return MAX_TRIES - (((await read())?.fails ?? 0) % MAX_TRIES);
}

export async function verifyPin(pin: string): Promise<Attempt> {
  const rec = await read();
  if (!rec) return { ok: false, reason: 'unlink' };
  const { rec: next, result } = nextAttempt(rec, same(hashOf(pin, rec.salt, rec.rounds), rec.hash), Date.now());
  if (result.ok && (rec.rounds ?? LEGACY_ROUNDS) < ROUNDS) {
    // An older, cheaper hash: re-hash now that the PIN is known.
    await write({ ...next, hash: hashOf(pin, rec.salt, ROUNDS), rounds: ROUNDS });
  } else if (next !== rec) await write(next);
  return result;
}
