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

import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type FontKey } from '@/theme/tokens';

interface Props extends TextProps {
  /** Font family + weight, see tokens.fonts. */
  f?: FontKey;
  size?: number;
  lh?: number;
  color?: string;
  /** Letter spacing in px (CSS em × size). */
  ls?: number;
  align?: TextStyle['textAlign'];
}

/**
 * Text with the design's type ramp. Custom fonts carry their own weight, so we never
 * set fontWeight (Android would otherwise fall back to the system font).
 */
export function Text({ f = 'body400', size = 16, lh, color, ls, align, style, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={1.3}
      {...rest}
      style={[
        {
          fontFamily: fonts[f],
          fontSize: size,
          lineHeight: lh,
          color: color ?? colors.text,
          letterSpacing: ls,
          textAlign: align,
        },
        style,
      ]}
    />
  );
}

/** Presets matching the canvas styles. */
export const type = {
  title: { f: 'display600', size: 30, lh: 36, ls: -0.6 },
  titleSm: { f: 'display600', size: 28, lh: 34, ls: -0.56 },
  titleXs: { f: 'display600', size: 26, lh: 32, ls: -0.52 },
  heading: { f: 'display600', size: 20, lh: 26, ls: -0.2 },
  body: { f: 'body400', size: 16, lh: 24 },
  bodySm: { f: 'body400', size: 15, lh: 22 },
  label: { f: 'body600', size: 13, lh: 18 },
  caption: { f: 'body400', size: 12, lh: 17 },
  eyebrow: { f: 'mono500', size: 12, lh: 16, ls: 1.44 },
  mono: { f: 'mono400', size: 13, lh: 18 },
  monoSm: { f: 'mono400', size: 11, lh: 14 },
} as const satisfies Record<string, { f: FontKey; size: number; lh: number; ls?: number }>;
