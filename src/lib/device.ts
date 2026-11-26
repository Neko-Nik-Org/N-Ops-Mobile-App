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

import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

import type { DeviceInfo as Info } from './types';

export function deviceInfo(): Info {
  const model = DeviceInfo.getModel();
  return {
    identifier: DeviceInfo.getUniqueIdSync(),
    name: DeviceInfo.getDeviceNameSync() || model,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    osVersion: DeviceInfo.getSystemVersion(),
    model,
  };
}
