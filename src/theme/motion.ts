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

import { Easing } from 'react-native-reanimated';

/** cubic-bezier(.2,.8,.2,1): the ease-out used everywhere in the design. */
export const easeOut = Easing.bezier(0.2, 0.8, 0.2, 1);

/** cubic-bezier(.3,1.6,.5,1): springy overshoot for pops (splash nodes, success badge). */
export const easePop = Easing.bezier(0.3, 1.6, 0.5, 1);

export const easeInOut = Easing.inOut(Easing.ease);
