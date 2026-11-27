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

import { authenticate, getBiometricInfo } from './biometrics';
import { hasPin } from './pin';
import { router } from './router';

let pending: ((ok: boolean) => void) | null = null;

/** Called by the lock screen when the PIN was entered correctly over a screen that asked for confirmation. */
export const ownerConfirmed = () => {
  pending?.(true);
  pending = null;
};

/**
 * Proves the person holding the phone is its owner before a sensitive action (approving, copying a secret).
 * Face ID / fingerprint when the phone has it; otherwise the app PIN, so the check is never skipped.
 */
export async function confirmOwner(prompt: string): Promise<boolean> {
  if ((await getBiometricInfo()).available) return authenticate(prompt);
  if (!(await hasPin())) return false;
  return new Promise<boolean>((resolve) => {
    pending = resolve;
    router.push({ pathname: '/lock', params: { resume: '1' } });
  });
}
