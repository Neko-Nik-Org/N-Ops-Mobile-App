/**
 * N-Ops design tokens. Mirrors `nops.css` on the design canvas one-to-one:
 * every screen reads these names, never a raw hex.
 */

export type ThemeName = 'dark' | 'light';
export type ThemePref = 'system' | ThemeName;

export interface Palette {
  bg: string;
  surface: string;
  raised: string;
  line: string;
  line2: string;
  field: string;
  text: string;
  textStrong: string;
  text2: string;
  muted: string;
  accent: string;
  primary: string;
  onPrimary: string;
  ok: string;
  okSoft: string;
  warn: string;
  warnText: string;
  warnSoft: string;
  warnLine: string;
  crit: string;
  critText: string;
  critSoft: string;
  violet: string;
  violetText: string;
  violetSoft: string;
  violetLine: string;
  ghost: string;
  shadow: string;
  shadowSm: string;
  dot: string;
  deco: string;
  decoNode: string;
  disabledBg: string;
  disabledText: string;
  tabbar: string;
  glowA: string;
  glowB: string;
  knob: string;
  trackOff: string;
}

export const palettes: Record<ThemeName, Palette> = {
  dark: {
    bg: '#0B1118',
    surface: '#121A24',
    raised: '#1A2430',
    line: '#1F2A37',
    line2: '#18222D',
    field: '#0F1620',
    text: '#E8EEF5',
    textStrong: '#F2F6FA',
    text2: '#C9D2DC',
    muted: '#9AA6B4',
    accent: '#4CF2C0',
    primary: '#4CF2C0',
    onPrimary: '#06281F',
    ok: '#4CF2C0',
    okSoft: 'rgba(76,242,192,0.12)',
    warn: '#FFB547',
    warnText: '#FFB547',
    warnSoft: 'rgba(255,181,71,0.12)',
    warnLine: 'rgba(255,181,71,0.35)',
    crit: '#FF6B81',
    critText: '#FF8597',
    critSoft: 'rgba(255,107,129,0.14)',
    violet: '#8A7CFF',
    violetText: '#B9B1FF',
    violetSoft: 'rgba(138,124,255,0.16)',
    violetLine: 'rgba(138,124,255,0.40)',
    ghost: 'rgba(232,238,245,0.10)',
    shadow: '0px 24px 48px rgba(0,0,0,0.35)',
    shadowSm: '0px 12px 24px rgba(0,0,0,0.35)',
    dot: 'rgba(139,151,166,0.18)',
    deco: '#1C2733',
    decoNode: '#2A3746',
    disabledBg: '#18222D',
    disabledText: '#6B7786',
    tabbar: 'rgba(14,21,29,0.96)',
    glowA: 'rgba(76,242,192,0.20)',
    glowB: 'rgba(138,124,255,0.12)',
    knob: '#FFFFFF',
    trackOff: '#2A3644',
  },
  light: {
    bg: '#FAF9F6',
    surface: '#FFFFFF',
    raised: '#F3F1EC',
    line: '#E6E3DC',
    line2: '#EFEDE8',
    field: '#FFFFFF',
    text: '#0B1118',
    textStrong: '#0B1118',
    text2: '#2B333D',
    muted: '#5D6673',
    accent: '#0B7F62',
    primary: '#0B1118',
    onPrimary: '#FFFFFF',
    ok: '#0E9F7A',
    okSoft: 'rgba(14,159,122,0.10)',
    warn: '#C27C00',
    warnText: '#9A5B00',
    warnSoft: 'rgba(194,124,0,0.10)',
    warnLine: 'rgba(194,124,0,0.40)',
    crit: '#E5485F',
    critText: '#C2334D',
    critSoft: 'rgba(229,72,95,0.10)',
    violet: '#8A7CFF',
    violetText: '#6152E0',
    violetSoft: 'rgba(97,82,224,0.10)',
    violetLine: 'rgba(97,82,224,0.35)',
    ghost: 'rgba(11,17,24,0.06)',
    shadow: '0px 20px 44px rgba(11,17,24,0.10)',
    shadowSm: '0px 10px 24px rgba(11,17,24,0.08)',
    dot: 'rgba(11,17,24,0.10)',
    deco: '#E6E3DC',
    decoNode: '#D3CFC6',
    disabledBg: '#ECEAE4',
    disabledText: '#8A929C',
    tabbar: 'rgba(255,255,255,0.96)',
    glowA: 'rgba(76,242,192,0.30)',
    glowB: 'rgba(138,124,255,0.18)',
    knob: '#FFFFFF',
    trackOff: '#D9D5CC',
  },
};

/** Brand constants that do not change with the theme. */
export const brand = {
  mint: '#4CF2C0',
  violet: '#8A7CFF',
  ink: '#0B1118',
  tile: '#0F1720',
  onMint: '#06281F',
  gradient: 'linear-gradient(90deg, #4CF2C0, #8A7CFF)',
  gradientDiagonal: 'linear-gradient(135deg, #4CF2C0, #8A7CFF)',
  /** The camera screen is dark in both themes. */
  camera: {
    bg: '#05080C',
    scrim: 'rgba(5,8,12,0.78)',
    text: '#E8EEF5',
    button: 'rgba(232,238,245,0.12)',
  },
} as const;

/** Font family names as registered by `useFonts` in the root layout. */
import { Platform } from 'react-native';

// iOS looks fonts up by PostScript name, Android by file name (see src/assets/fonts).
const ps = (android: string, ios: string) => Platform.select({ ios, default: android })!;

export const fonts = {
  display600: ps('SpaceGrotesk_600SemiBold', 'SpaceGrotesk-SemiBold'),
  display700: ps('SpaceGrotesk_700Bold', 'SpaceGrotesk-Bold'),
  body400: ps('Inter_400Regular', 'Inter-Regular'),
  body500: ps('Inter_500Medium', 'Inter-Medium'),
  body600: ps('Inter_600SemiBold', 'Inter-SemiBold'),
  body700: ps('Inter_700Bold', 'Inter-Bold'),
  mono400: ps('JetBrainsMono_400Regular', 'JetBrainsMono-Regular'),
  mono500: ps('JetBrainsMono_500Medium', 'JetBrainsMono-Medium'),
  mono600: ps('JetBrainsMono_600SemiBold', 'JetBrainsMono-SemiBold'),
};

export type FontKey = keyof typeof fonts;

export const radius = {
  code: 10,
  sm: 12,
  tile: 14,
  button: 16,
  card: 20,
  sheet: 28,
  pill: 999,
} as const;

export const space = {
  screen: 24,
  screenDense: 20,
  /** Bottom padding the design adds above the home indicator. */
  bottomExtra: 6,
} as const;

/** Durations in ms. Easing lives in `motion.ts` (Reanimated). */
export const durations = {
  tap: 150,
  screen: 250,
  content: 400,
} as const;

/** Design frame the canvas was drawn at (iPhone 14/15). */
export const designFrame = { width: 390, height: 844 } as const;
