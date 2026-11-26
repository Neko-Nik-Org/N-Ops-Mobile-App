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

import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const o = { enableVibrateFallback: false, ignoreAndroidSystemSettings: false };
export const Haptics = {
  success: () => ReactNativeHapticFeedback.trigger('notificationSuccess', o),
  warning: () => ReactNativeHapticFeedback.trigger('notificationWarning', o),
  error: () => ReactNativeHapticFeedback.trigger('notificationError', o),
  light: () => ReactNativeHapticFeedback.trigger('impactLight', o),
};
