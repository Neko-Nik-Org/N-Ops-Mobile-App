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

import * as Keychain from 'react-native-keychain';

/**
 * Face ID / fingerprint unlock, bound to the phone's CURRENT set of faces and fingers.
 * We keep a throwaway secret in the Keychain/Keystore that only a biometric check can read. If someone adds a face
 * or finger to the phone afterwards, the OS invalidates it, reading it finds nothing, and biometric unlock is
 * turned off until the PIN is entered again (Profile asks for it to turn it back on).
 */

const KEY = 'nops.bio.v1';
const base = { service: KEY };

export type BioResult = 'ok' | 'changed' | 'cancelled';

/** Reads the secret: asks for Face ID / fingerprint. */
export async function biometricUnlock(prompt: string): Promise<BioResult> {
  try {
    const c = await Keychain.getGenericPassword({ ...base, authenticationPrompt: { title: prompt, cancel: 'Use PIN' } });
    // Nothing there although we stored it: the OS dropped it because the set of faces/fingers changed.
    return c ? 'ok' : 'changed';
  } catch {
    return 'cancelled'; // the user backed out, or the sensor failed: keep biometrics, show the keypad
  }
}

/** Stores the secret, then proves the user can pass the check (so they can't lock themselves out of it). */
export async function enableBiometricUnlock(prompt: string): Promise<boolean> {
  try {
    await Keychain.setGenericPassword('bio', '1', {
      ...base,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      authenticationPrompt: { title: prompt, cancel: 'Cancel' },
    });
    if ((await biometricUnlock(prompt)) === 'ok') return true;
  } catch {
    /* fall through */
  }
  await disableBiometricUnlock();
  return false;
}

export async function disableBiometricUnlock(): Promise<void> {
  await Keychain.resetGenericPassword(base).catch(() => undefined);
}
