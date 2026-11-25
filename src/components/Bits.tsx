import { useEffect, useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import { brand, radius } from '@/theme/tokens';
import { easeInOut } from '@/theme/motion';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/** "N-Ops" wordmark with the hyphen drawn as a gradient bar. */
export function Wordmark({ size = 18, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  const c = color ?? colors.textStrong;
  const barW = Math.round(size * 0.435);
  const barH = Math.max(3, Math.round(size * 0.152));
  return (
    <View style={styles.wordmark} accessible accessibilityLabel="N-Ops">
      <Text f="display700" size={size} lh={size * 1.1} ls={-size * 0.02} color={c}>
        N
      </Text>
      <View
        style={{
          width: barW,
          height: barH,
          borderRadius: Math.max(1, barH / 3.5),
          marginHorizontal: Math.max(2, size * 0.087),
          marginTop: size * 0.13,
          backgroundImage: brand.gradient,
        }}
      />
      <Text f="display700" size={size} lh={size * 1.1} ls={-size * 0.02} color={c}>
        Ops
      </Text>
    </View>
  );
}

/** Segmented progress bar for the welcome pager. `position` is the page index as a float. */
export function StepProgress({ count, position }: { count: number; position: SharedValue<number> }) {
  const { colors } = useTheme();
  return (
    <View style={styles.progress} accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <Segment key={i} index={i} position={position} track={colors.line} fill={colors.ok} />
      ))}
    </View>
  );
}

function Segment({ index, position, track, fill }: { index: number; position: SharedValue<number>; track: string; fill: string }) {
  const style = useAnimatedStyle(() => ({
    width: `${interpolate(position.value + 1 - index, [0, 1], [0, 100], Extrapolation.CLAMP)}%`,
  }));
  return (
    <View style={[styles.segment, { backgroundColor: track }]}>
      <Animated.View style={[styles.segmentFill, { backgroundColor: fill }, style]} />
    </View>
  );
}

/** Small status dot with a soft ring; shape differs so colour is never the only signal. */
export function StatusDot({ tone, shape = 'circle' }: { tone: 'ok' | 'warn' | 'crit'; shape?: 'circle' | 'square' | 'diamond' }) {
  const { colors } = useTheme();
  const bg = tone === 'ok' ? colors.ok : tone === 'warn' ? colors.warn : colors.crit;
  const ring = tone === 'ok' ? colors.okSoft : tone === 'warn' ? colors.warnSoft : colors.critSoft;
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: shape === 'circle' ? 4 : 2,
        backgroundColor: bg,
        transform: shape === 'diamond' ? [{ rotate: '45deg' }] : undefined,
        boxShadow: `0px 0px 0px 4px ${ring}`,
      }}
    />
  );
}

export function Chip({ label, tone }: { label: string; tone: 'ok' | 'warn' | 'violet' }) {
  const { colors } = useTheme();
  const map = {
    ok: [colors.okSoft, colors.accent],
    warn: [colors.warnSoft, colors.warnText],
    violet: [colors.violetSoft, colors.violetText],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: bg }}>
      <Text f="body600" size={11} lh={14} color={fg}>
        {label}
      </Text>
    </View>
  );
}

/** Rounded icon tile (32 or 36 px) used in cards and lists. */
export function IconTile({
  icon,
  tone,
  size = 32,
  iconSize = 16,
  strokeWidth = 2,
  radius: r = 10,
}: {
  icon: IconName;
  tone: 'ok' | 'warn' | 'crit' | 'violet' | 'surface';
  size?: number;
  iconSize?: number;
  strokeWidth?: number;
  radius?: number;
}) {
  const { colors } = useTheme();
  const map = {
    ok: [colors.okSoft, colors.accent],
    warn: [colors.warnSoft, colors.warnText],
    crit: [colors.critSoft, colors.critText],
    violet: [colors.violetSoft, colors.violetText],
    surface: [colors.surface, colors.violetText],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: r, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={iconSize} color={fg} strokeWidth={strokeWidth} />
    </View>
  );
}

export function Card({ children, style, border }: { children: ReactNode; style?: StyleProp<ViewStyle>; border?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[{ borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: border ?? colors.line }, style]}>
      {children}
    </View>
  );
}

/** The faint N-shaped network behind the welcome illustrations (342×330). */
export function NodeDeco({ width = 342, height = 330 }: { width?: number; height?: number }) {
  const { colors } = useTheme();
  const pts: ReadonlyArray<readonly [number, number]> = [
    [24, 36],
    [24, 296],
    [318, 36],
    [318, 296],
  ];
  return (
    <Svg width={width} height={height} viewBox="0 0 342 330" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no">
      <Path d="M24 296 L24 36 L318 296 L318 36" fill="none" stroke={colors.deco} strokeWidth={1.5} />
      <G fill={colors.bg} stroke={colors.decoNode} strokeWidth={2}>
        {pts.map(([cx, cy]) => (
          <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={6} />
        ))}
      </G>
    </Svg>
  );
}

/** Deterministic QR-looking pattern for illustrations and mock camera feed. Not a real code. */
export function useFakeQrPath(size: 21 | 25, seed: number) {
  return useMemo(() => {
    let s = seed;
    const rnd = () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
    const far = size - 7;
    const finders: Array<[number, number]> = [
      [0, 0],
      [far, 0],
      [0, far],
    ];
    let d = '';
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let on: boolean;
        const f = finders.find(([ox, oy]) => x >= ox - 1 && x <= ox + 7 && y >= oy - 1 && y <= oy + 7);
        if (f) {
          const dx = x - f[0];
          const dy = y - f[1];
          if (dx < 0 || dy < 0 || dx > 6 || dy > 6) on = false;
          else if (dx === 0 || dy === 0 || dx === 6 || dy === 6) on = true;
          else on = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        } else if (size === 25 && x >= 16 && x <= 20 && y >= 16 && y <= 20) {
          on = Math.max(Math.abs(x - 18), Math.abs(y - 18)) !== 1;
        } else if (y === 6) {
          on = x % 2 === 0;
        } else if (x === 6) {
          on = y % 2 === 0;
        } else {
          on = rnd() < 0.5;
        }
        if (on) d += `M${x} ${y}h1v1h-1z`;
      }
    }
    return d;
  }, [size, seed]);
}

/** Gentle up-and-down float (5 s loop, 6 px), used for illustration chips. */
export function useFloat() {
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    y.value = withRepeat(withSequence(withTiming(-6, { duration: 2500, easing: easeInOut }), withTiming(0, { duration: 2500, easing: easeInOut })), -1);
    return () => cancelAnimation(y);
  }, [reduce, y]);
  return useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
}

/** 1 s step blink (text carets). */
export function useBlink() {
  const reduce = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    o.value = withRepeat(withSequence(withDelay(500, withTiming(0, { duration: 0 })), withDelay(500, withTiming(1, { duration: 0 }))), -1);
    return () => cancelAnimation(o);
  }, [reduce, o]);
  return useAnimatedStyle(() => ({ opacity: o.value }));
}

/** Soft opacity pulse (2.6 s), used for "Looking for a code…". */
export function usePulse() {
  const reduce = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    o.value = withRepeat(withSequence(withTiming(0.55, { duration: 1300, easing: easeInOut }), withTiming(1, { duration: 1300, easing: easeInOut })), -1);
    return () => cancelAnimation(o);
  }, [reduce, o]);
  return useAnimatedStyle(() => ({ opacity: o.value }));
}

const styles = StyleSheet.create({
  wordmark: { flexDirection: 'row', alignItems: 'center' },
  progress: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  segmentFill: { height: 4, borderRadius: 2 },
});
