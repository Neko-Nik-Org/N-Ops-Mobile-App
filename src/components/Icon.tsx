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

import Svg, { Path } from 'react-native-svg';

/** Stroke icons from the canvas (24×24 grid, round caps and joins). */
const paths = {
  tag: 'M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z M8 8h.01',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  wrench: 'M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.5 2.5-2.2-.5-.5-2.2 2.2-2.8z',
  boxes: 'M3 8l9-5 9 5v8l-9 5-9-5V8z M3 8l9 5 9-5 M12 13v8',
  lineChart: 'M3 3v18h18 M7 15l4-5 3 3 5-7',
  scroll: 'M8 4h11v13a3 3 0 0 1-3 3H6a3 3 0 0 0 3-3V4z M8 4a3 3 0 0 0-3 3v1h3 M12 9h4 M12 13h4',
  arrowRight: 'M5 12h14 M13 6l6 6-6 6',
  arrowLeft: 'M19 12H5 M11 6l-6 6 6 6',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronRight: 'M9 6l6 6-6 6',
  chevronDown: 'M6 9l6 6 6-6',
  shieldCheck: 'M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3z M9 12l2 2 4-4',
  alertTriangle: 'M12 4l9 16H3l9-16z M12 10v4 M12 17.5v.01',
  alertCircle: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M12 8v5 M12 16.5v.01',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  lock: 'M7 11h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z M8 11V8a4 4 0 0 1 8 0v3',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8 M10 21a2 2 0 0 0 4 0',
  servers:
    'M4.5 4h15A1.5 1.5 0 0 1 21 5.5v4a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 9.5v-4A1.5 1.5 0 0 1 4.5 4z M4.5 13h15a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-4A1.5 1.5 0 0 1 4.5 13z M7 7.5h.01 M7 16.5h.01',
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  user: 'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6',
  keyboard:
    'M4.5 6h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z M6 10h.01 M10 10h.01 M14 10h.01 M18 10h.01 M7 14h10',
  flashlight: 'M8 3h8v4l-2 3v10a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V10L8 7V3z M12 13v2',
  clipboard:
    'M9 3h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2',
  faceId:
    'M4 8V6a2 2 0 0 1 2-2h2 M16 4h2a2 2 0 0 1 2 2v2 M20 16v2a2 2 0 0 1-2 2h-2 M8 20H6a2 2 0 0 1-2-2v-2 M9 10v1 M15 10v1 M12 10v3h-1 M9.5 15.5c1.4 1 3.6 1 5 0',
  key: 'M12 15a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M11 12l9-9 M17 6l3 3 M15 8l2 2',
  unlink: 'M9 15l6-6 M11 6l.5-.5a4.2 4.2 0 0 1 6 6l-.5.5 M13 18l-.5.5a4.2 4.2 0 0 1-6-6l.5-.5 M4 4l16 16',
  qrScan:
    'M4 8V6a2 2 0 0 1 2-2h2 M16 4h2a2 2 0 0 1 2 2v2 M20 16v2a2 2 0 0 1-2 2h-2 M8 20H6a2 2 0 0 1-2-2v-2 M9 8h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z',
  workflow: 'M4 6h6v6H4z M14 12h6v6h-6z M10 9h4v6',
  camera:
    'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z M15 13.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  refresh: 'M20 11a8 8 0 0 0-14.9-3.5 M4 4v4h4 M4 13a8 8 0 0 0 14.9 3.5 M20 20v-4h-4',
} as const;

export type IconName = keyof typeof paths;

interface Props {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, color, strokeWidth = 2 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden importantForAccessibility="no">
      <Path d={paths[name]} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
