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

import { useEffect, useState } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import { brand, radius } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/*
 * Loading and feedback kit (design: "Loading UI kit").
 * spin 1.4 s · shimmer 1.6 s · dots 0.9 s · ease (.2,.8,.2,1)
 * Match the feedback to the wait: Spinner (0.3-2 s, pair with words), ProgressBar (known amount),
 * Skeleton (a page's shape before its data), Banner (results and problems).
 */

/** Runs 0 -> 1 forever. Still under "reduce motion". */
function useLoop(ms: number, easing = Easing.linear) {
  const v = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    v.value = 0;
    v.value = withRepeat(withTiming(1, { duration: ms, easing }), -1);
    return () => cancelAnimation(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, ms]);
  return v;
}

/** Ring spinner: 16 inline, 24 rows, 40 screen. */
export function Spinner({ size = 24, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  const t = useLoop(1400);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${t.value * 360}deg` }] }));
  return (
    <Animated.View style={[{ width: size, height: size }, spin]} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={9} fill="none" stroke={colors.line} strokeWidth={3} />
        <Circle cx={12} cy={12} r={9} fill="none" stroke={color ?? colors.ok} strokeWidth={3} strokeLinecap="round" strokeDasharray="16 41" />
      </Svg>
    </Animated.View>
  );
}

/** A spinner with words, for a wait that is on its own ("Syncing your workspace..."). */
export function InlineLoading({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.inline, { backgroundColor: colors.raised }]} accessibilityLiveRegion="polite">
      <Spinner size={16} />
      <Text f="body600" size={14} lh={20} color={colors.textStrong}>
        {label}
      </Text>
    </View>
  );
}

/** Known amount: pass `value` (0-1). Unknown, short waits: leave it out for the shuttle. */
export function ProgressBar({ value, label, detail }: { value?: number; label?: string; detail?: string }) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const t = useLoop(1100, Easing.inOut(Easing.ease));
  const shuttle = useAnimatedStyle(() => ({ transform: [{ translateX: -w * 0.4 + t.value * w * 1.4 }] }));
  const determinate = value !== undefined;
  return (
    <View style={{ gap: 8 }}>
      {label || detail ? (
        <View style={styles.between}>
          <Text f="body600" size={13} lh={18} color={colors.textStrong}>
            {label}
          </Text>
          <Text f="mono400" size={13} lh={18} color={colors.muted}>
            {detail}
          </Text>
        </View>
      ) : null}
      <View
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        accessibilityRole="progressbar"
        accessibilityValue={determinate ? { min: 0, max: 100, now: Math.round(value * 100) } : undefined}
        style={[styles.track, { height: determinate ? 8 : 4, borderRadius: determinate ? 4 : 2, backgroundColor: colors.line }]}
      >
        {determinate ? (
          <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', borderRadius: 4, backgroundImage: brand.gradient }} />
        ) : (
          <Animated.View style={[{ width: '40%', height: '100%', borderRadius: 2, backgroundColor: colors.ok }, shuttle]} />
        )}
      </View>
    </View>
  );
}

/** A grey block that shimmers; build a page's shape out of these while its data loads. */
export function Skeleton({ width = '100%', height = 16, round = radius.sm, style }: { width?: DimensionValue; height?: number; round?: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const t = useLoop(1600);
  const sweep = useAnimatedStyle(() => ({ transform: [{ translateX: -w + t.value * w * 2 }] }));
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={[{ width, height, borderRadius: round, backgroundColor: colors.raised, overflow: 'hidden' }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[StyleSheet.absoluteFill, { width: w, backgroundImage: `linear-gradient(90deg, transparent, ${colors.line2}, transparent)` }, sweep]} />
    </View>
  );
}

type Tone = 'ok' | 'warn' | 'crit' | 'info';

/** Results and problems. Success fades after 3 s (calls onDismiss); problems stay until fixed or dismissed. */
export function Banner({ tone, title, body, onDismiss }: { tone: Tone; title: string; body?: string; onDismiss?: () => void }) {
  const { colors } = useTheme();
  useEffect(() => {
    if (tone !== 'ok' || !onDismiss) return;
    const id = setTimeout(onDismiss, 3000);
    return () => clearTimeout(id);
  }, [tone, onDismiss]);
  const look: Record<Tone, { bg: string; fg: string; icon: IconName }> = {
    ok: { bg: colors.okSoft, fg: colors.accent, icon: 'check' },
    warn: { bg: colors.warnSoft, fg: colors.warnText, icon: 'alertTriangle' },
    crit: { bg: colors.critSoft, fg: colors.critText, icon: 'alertCircle' },
    info: { bg: colors.violetSoft, fg: colors.violetText, icon: 'shieldCheck' },
  };
  const l = look[tone];
  return (
    <View style={[styles.banner, { backgroundColor: l.bg }]} accessibilityLiveRegion={tone === 'ok' ? 'polite' : 'assertive'}>
      <Icon name={l.icon} size={18} color={l.fg} strokeWidth={2.2} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text f="body600" size={14} lh={19} color={l.fg}>
          {title}
        </Text>
        {body ? (
          <Text size={13} lh={18} color={l.fg}>
            {body}
          </Text>
        ) : null}
      </View>
      {onDismiss && tone !== 'ok' ? (
        <Text f="body600" size={13} lh={18} color={l.fg} onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss">
          Dismiss
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, alignSelf: 'flex-start' },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { overflow: 'hidden' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.sm },
});
