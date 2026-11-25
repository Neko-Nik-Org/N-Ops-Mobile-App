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
