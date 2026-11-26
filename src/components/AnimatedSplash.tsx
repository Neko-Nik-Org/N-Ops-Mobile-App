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

import { Haptics } from '@/lib/haptics';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import { brand } from '@/theme/tokens';
import { useBlink, Wordmark } from './Bits';
import { BrandGradient, N_PATH, NODES, useSvgId } from './Logo';
import { Text } from './Text';

/**
 * The launch animation from the "Splash motion" spec board (about 2 s):
 *   150–550 ms   four nodes pop in, 100 ms apart, light haptic on the last
 *   450–900 ms   the N stroke draws through them
 *   750–1200 ms  tile fades in, gradient border traces round, glow blooms
 *   1100–1500 ms wordmark rises; a light packet runs along the N
 *   1450–2000 ms tagline types out, boot bar fills, then the app cross-fades on
 * One master clock `t` (ms) drives every element, so the timing matches the spec exactly.
 */

export const SPLASH_MS = 2000;
const TAGLINE = 'open-source infra control plane';
const LOGO = 132;
const N_LEN = 206;
const BORDER_LEN = 548;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

function seg(t: number, a: number, b: number) {
  'worklet';
  return Math.min(1, Math.max(0, (t - a) / (b - a)));
}
function easeOutCubic(x: number) {
  'worklet';
  return 1 - Math.pow(1 - x, 3);
}
function easeInOutCubic(x: number) {
  'worklet';
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
/** Overshoots to ~1.2 then settles, like cubic-bezier(.3,1.6,.5,1). */
function backOut(x: number) {
  'worklet';
  const c1 = 2.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/** Point along the N polyline (lengths 60, 84.85, 60). */
function pointOnN(p: number) {
  'worklet';
  const l1 = 60;
  const l2 = 84.8528;
  const total = l1 + l2 + 60;
  const d = p * total;
  if (d <= l1) return { x: 50, y: 110 - d };
  if (d <= l1 + l2) {
    const k = (d - l1) / l2;
    return { x: 50 + 60 * k, y: 50 + 60 * k };
  }
  const k = (d - l1 - l2) / 60;
  return { x: 110, y: 110 - 60 * k };
}

function Node({ t, cx, cy, delay, stroke }: { t: SharedValue<number>; cx: number; cy: number; delay: number; stroke: string }) {
  const props = useAnimatedProps(() => {
    const p = seg(t.value, delay, delay + 260);
    const s = p <= 0 ? 0 : backOut(p);
    return { r: 11 * s, strokeWidth: 5 * s, opacity: p > 0 ? 1 : 0 };
  });
  return <AnimatedCircle cx={cx} cy={cy} fill={brand.ink} stroke={stroke} animatedProps={props} />;
}

interface Props {
  /** Called once the animation (or the reduced-motion hold) has finished. */
  onDone: () => void;
  /** Optional content pinned to the bottom (e.g. an Unlock button). */
  footer?: ReactNode;
}

export function AnimatedSplash({ onDone, footer }: Props) {
  const { colors, scheme } = useTheme();
  const { width: W, height: H } = useWindowDimensions();
  const reduce = useReducedMotion();
  const t = useSharedValue(reduce ? SPLASH_MS : 0);
  const gid = useSvgId('sp');
  const [charW, setCharW] = useState(7.8);

  useEffect(() => {
    if (reduce) {
      t.value = SPLASH_MS;
      const id = setTimeout(onDone, 400);
      return () => clearTimeout(id);
    }
    t.value = withTiming(SPLASH_MS, { duration: SPLASH_MS, easing: Easing.linear });
    const haptic = setTimeout(() => Haptics.light(), 710);
    const done = setTimeout(onDone, SPLASH_MS);
    return () => {
      clearTimeout(haptic);
      clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const stroke = `url(#${gid})`;
  const nProps = useAnimatedProps(() => ({ strokeDashoffset: N_LEN * (1 - easeInOutCubic(seg(t.value, 450, 900))) }));
  const tileProps = useAnimatedProps(() => ({ opacity: easeOutCubic(seg(t.value, 750, 1100)) }));
  const borderProps = useAnimatedProps(() => ({ strokeDashoffset: BORDER_LEN * (1 - easeInOutCubic(seg(t.value, 750, 1200))) }));
  const packetProps = useAnimatedProps(() => {
    const p = seg(t.value, 1150, 1450);
    const pt = pointOnN(p);
    const on = t.value >= 1150 && t.value <= 1450;
    return { cx: pt.x, cy: pt.y, opacity: on ? 1 : 0 };
  });
  const packetGlowProps = useAnimatedProps(() => {
    const p = seg(t.value, 1150, 1450);
    const pt = pointOnN(p);
    const on = t.value >= 1150 && t.value <= 1450;
    return { cx: pt.x, cy: pt.y, opacity: on ? 0.35 : 0 };
  });

  const glowStyle = useAnimatedStyle(() => {
    const p = easeOutCubic(seg(t.value, 800, 1300));
    return { opacity: p, transform: [{ scale: 0.6 + 0.4 * p }] };
  });
  const wordStyle = useAnimatedStyle(() => {
    const p = easeOutCubic(seg(t.value, 1100, 1500));
    return { opacity: p, transform: [{ translateY: 14 * (1 - p) }] };
  });
  const fadeStyle = useAnimatedStyle(() => {
    const p = easeOutCubic(seg(t.value, 1300, 1600));
    return { opacity: p, transform: [{ translateY: 14 * (1 - p) }] };
  });
  const typeStyle = useAnimatedStyle(() => {
    const chars = Math.floor(seg(t.value, 1450, 1900) * TAGLINE.length);
    return { width: chars * charW };
  });
  const bootStyle = useAnimatedStyle(() => ({ width: `${easeInOutCubic(seg(t.value, 1450, 1950)) * 100}%` }));
  const caret = useBlink();

  const logoTop = Math.round(H * 0.301);
  const glow = scheme === 'dark' ? { a: 0.2, b: 0.12, dot: 'rgb(139,151,166)', dotO: 0.18 } : { a: 0.3, b: 0.18, dot: brand.ink, dotO: 0.1 };

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} accessibilityLabel="N-Ops is starting">
      <Svg width={W} height={H} style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no">
        <Defs>
          <Pattern id={`${gid}dots`} width={22} height={22} patternUnits="userSpaceOnUse">
            <Circle cx={11} cy={11} r={1.2} fill={glow.dot} fillOpacity={glow.dotO} />
          </Pattern>
          <RadialGradient id={`${gid}vig`} cx={W * 0.5} cy={H * 0.44} rx={W * 0.75} ry={H * 0.55} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={colors.bg} stopOpacity={0} />
            <Stop offset="0.78" stopColor={colors.bg} stopOpacity={1} />
            <Stop offset="1" stopColor={colors.bg} stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Rect width={W} height={H} fill={`url(#${gid}dots)`} />
        <Rect width={W} height={H} fill={`url(#${gid}vig)`} />
      </Svg>

      <Animated.View style={[styles.glow, { top: logoTop + LOGO / 2 - 140, left: W / 2 - 140 }, glowStyle]} pointerEvents="none">
        <Svg width={280} height={280}>
          <Defs>
            <RadialGradient id={`${gid}glow`} cx={140} cy={140} r={140} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={brand.mint} stopOpacity={glow.a} />
              <Stop offset="0.45" stopColor={brand.violet} stopOpacity={glow.b} />
              <Stop offset="0.7" stopColor={brand.violet} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={140} cy={140} r={140} fill={`url(#${gid}glow)`} />
        </Svg>
      </Animated.View>

      <View style={[styles.column, { top: logoTop }]}>
        <Svg width={LOGO} height={LOGO} viewBox="0 0 160 160" style={{ overflow: 'visible' }} accessibilityLabel="N-Ops logo">
          <Defs>
            <BrandGradient id={gid} />
          </Defs>
          <AnimatedRect x={3} y={3} width={154} height={154} rx={40} fill={brand.tile} animatedProps={tileProps} />
          <AnimatedRect x={3} y={3} width={154} height={154} rx={40} fill="none" stroke={stroke} strokeWidth={3} strokeDasharray={[BORDER_LEN, BORDER_LEN]} animatedProps={borderProps} />
          <AnimatedPath d={N_PATH} fill="none" stroke={stroke} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={[N_LEN, N_LEN]} animatedProps={nProps} />
          <G>
            {NODES.map(([cx, cy], i) => (
              <Node key={`${cx}-${cy}`} t={t} cx={cx} cy={cy} delay={150 + i * 100} stroke={stroke} />
            ))}
          </G>
          <AnimatedCircle r={9} fill={brand.mint} animatedProps={packetGlowProps} />
          <AnimatedCircle r={4.5} fill="#E9FFF8" animatedProps={packetProps} />
        </Svg>

        <View style={styles.texts}>
          <Animated.View style={wordStyle}>
            <Wordmark size={46} />
          </Animated.View>
          <Animated.View style={[styles.tagline, fadeStyle]}>
            <Text f="mono400" size={13} lh={18} color={colors.accent}>
              $
            </Text>
            <Animated.View style={[styles.typeMask, typeStyle]}>
              <Text f="mono400" size={13} lh={18} color={colors.muted} style={[styles.typeText, { width: TAGLINE.length * charW + 4 }]}>
                {TAGLINE}
              </Text>
            </Animated.View>
            <Animated.View style={[styles.caret, { backgroundColor: colors.accent }, caret]} />
          </Animated.View>
          {/* Measures one monospace character so the typing reveal steps exactly one glyph at a time. */}
          <Text
            f="mono400"
            size={13}
            lh={18}
            style={styles.measure}
            onLayout={(e) => setCharW(e.nativeEvent.layout.width / TAGLINE.length)}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {TAGLINE}
          </Text>
        </View>
      </View>

      <View style={styles.bottom}>
        {footer}
        <View style={[styles.bootTrack, { backgroundColor: colors.line }]}>
          <Animated.View style={[styles.bootFill, bootStyle]} />
        </View>
        <Animated.View style={fadeStyle}>
          <Text f="mono400" size={11} lh={14} ls={0.88} color={colors.muted}>
            by Neko Nik
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', width: 280, height: 280 },
  column: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 34 },
  texts: { alignItems: 'center', gap: 16 },
  tagline: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 18 },
  typeMask: { overflow: 'hidden', height: 18 },
  typeText: { flexShrink: 0 },
  caret: { width: 7, height: 15, marginLeft: -6 },
  measure: { position: 'absolute', opacity: 0, top: -1000 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 60, alignItems: 'center', gap: 16 },
  bootTrack: { width: 120, height: 2, borderRadius: 2, overflow: 'hidden' },
  bootFill: { height: 2, backgroundImage: brand.gradient },
});
