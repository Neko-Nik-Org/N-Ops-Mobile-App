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

import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Portrait content never gets wider than this; landscape uses the full width. */
export const MAX_W = 720;

/** From this width (tablet landscape) the drawer is a permanent side panel. */
export const PERMANENT_W = 900;

/** Usable column: full width (minus side insets) in landscape, capped and centered in portrait. */
export function useColumn() {
  const { width, height } = useWindowDimensions();
  const { left, right } = useSafeAreaInsets();
  const landscape = width > height;
  const W = landscape ? width - left - right : Math.min(width, MAX_W);
  return { W, H: height, landscape, left, right, land: landscape && height < 500 };
}
