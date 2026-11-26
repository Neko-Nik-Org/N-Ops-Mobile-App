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

import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { Platform } from 'react-native';

export interface BiometricInfo {
  available: boolean;
  /** "Face ID", "Touch ID", "fingerprint", "face unlock" or "biometrics". */
  label: string;
  kind: 'face' | 'fingerprint' | 'other';
}

// Passcode fallback, like the Expo app.
const rnb = new ReactNativeBiometrics({ allowDeviceCredentials: true });

export async function getBiometricInfo(): Promise<BiometricInfo> {
  try {
    const { available, biometryType } = await rnb.isSensorAvailable();
    const ios = Platform.OS === 'ios';
    const face = biometryType === BiometryTypes.FaceID;
    const finger = biometryType === BiometryTypes.TouchID || (!ios && biometryType === BiometryTypes.Biometrics);
    const label = face ? 'Face ID' : finger ? (ios ? 'Touch ID' : 'fingerprint') : 'biometrics';
    return { available, label, kind: face ? 'face' : finger ? 'fingerprint' : 'other' };
  } catch {
    return { available: false, label: 'biometrics', kind: 'other' };
  }
}

/** Biometric prompt with passcode fallback. Resolves true on success. */
export async function authenticate(promptMessage: string): Promise<boolean> {
  try {
    return (await rnb.simplePrompt({ promptMessage, cancelButtonText: 'Cancel' })).success;
  } catch {
    return false;
  }
}

/** Title for the unlock toggle, e.g. "Unlock with Face ID" or "Unlock with fingerprint". */
export function unlockTitle(info: BiometricInfo): string {
  return `Unlock with ${info.label}`;
}
