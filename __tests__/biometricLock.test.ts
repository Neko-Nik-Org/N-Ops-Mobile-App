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

import { biometricUnlock, disableBiometricUnlock, enableBiometricUnlock, isBioPromptOpen } from '../src/lib/biometricLock';

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'x' },
  ACCESS_CONTROL: { BIOMETRY_CURRENT_SET: 'y' },
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(async () => true),
}));
const kc = Keychain as jest.Mocked<typeof Keychain>;

beforeEach(() => jest.clearAllMocks());

describe('biometricLock', () => {
  it('ok when the secret can be read', async () => {
    kc.getGenericPassword.mockResolvedValueOnce({ username: 'bio', password: '1' } as never);
    expect(await biometricUnlock('Unlock')).toBe('ok');
  });
  it('"changed" when the OS dropped the secret (new face or finger added)', async () => {
    kc.getGenericPassword.mockResolvedValueOnce(false);
    expect(await biometricUnlock('Unlock')).toBe('changed');
  });
  it('"cancelled" when the user backs out', async () => {
    kc.getGenericPassword.mockRejectedValueOnce(new Error('cancel'));
    expect(await biometricUnlock('Unlock')).toBe('cancelled');
  });
  it('knows while the system prompt is open, and not after', async () => {
    let during = false;
    kc.getGenericPassword.mockImplementationOnce(async () => {
      during = isBioPromptOpen();
      return { username: 'bio', password: '1' } as never;
    });
    await biometricUnlock('Unlock');
    expect(during).toBe(true);
    expect(isBioPromptOpen()).toBe(false);
  });
  it('enable stores the secret and proves it can be read; otherwise it switches itself off', async () => {
    kc.setGenericPassword.mockResolvedValueOnce({} as never);
    kc.getGenericPassword.mockResolvedValueOnce({ username: 'bio', password: '1' } as never);
    expect(await enableBiometricUnlock('Turn on')).toBe(true);
    kc.setGenericPassword.mockResolvedValueOnce({} as never);
    kc.getGenericPassword.mockRejectedValueOnce(new Error('cancel'));
    expect(await enableBiometricUnlock('Turn on')).toBe(false);
    expect(kc.resetGenericPassword).toHaveBeenCalled();
  });
  it('disable clears the secret', async () => {
    await disableBiometricUnlock();
    expect(kc.resetGenericPassword).toHaveBeenCalled();
  });
});
