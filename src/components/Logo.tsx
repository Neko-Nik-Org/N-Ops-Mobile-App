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

import { useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { brand } from '@/theme/tokens';

export const N_PATH = 'M50 110 L50 50 L110 110 L110 50';
export const NODES: ReadonlyArray<readonly [number, number]> = [
  [50, 110],
  [50, 50],
  [110, 110],
  [110, 50],
];

/** SVG ids must be plain; React's useId contains colons. */
export function useSvgId(prefix: string) {
  return prefix + useId().replace(/[^a-zA-Z0-9]/g, '');
}

export function BrandGradient({ id }: { id: string }) {
  return (
    <LinearGradient id={id} x1="0" y1="1" x2="1" y2="0">
      <Stop offset="0" stopColor={brand.mint} />
      <Stop offset="1" stopColor={brand.violet} />
    </LinearGradient>
  );
}

/** Header-size logo: tile + N, no node rings (as on the welcome and dashboard headers). */
export function LogoMark({ size = 28 }: { size?: number }) {
  const id = useSvgId('lm');
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" accessibilityElementsHidden importantForAccessibility="no">
      <Defs>
        <BrandGradient id={id} />
      </Defs>
      <Rect x={3} y={3} width={154} height={154} rx={40} fill={brand.tile} stroke={`url(#${id})`} strokeWidth={6} />
      <Path d={N_PATH} fill="none" stroke={`url(#${id})`} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Full logo with node rings (static). */
export function LogoFull({ size = 96 }: { size?: number }) {
  const id = useSvgId('lf');
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" accessibilityLabel="N-Ops">
      <Defs>
        <BrandGradient id={id} />
      </Defs>
      <Rect x={3} y={3} width={154} height={154} rx={40} fill={brand.tile} stroke={`url(#${id})`} strokeWidth={3} />
      <Path d={N_PATH} fill="none" stroke={`url(#${id})`} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
      {NODES.map(([cx, cy]) => (
        <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={11} fill={brand.ink} stroke={`url(#${id})`} strokeWidth={5} />
      ))}
    </Svg>
  );
}
