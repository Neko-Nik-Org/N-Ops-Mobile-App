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

import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Haptics } from '@/lib/haptics';
import { PIN_LENGTH } from '@/lib/pin';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from './Icon';
import { Spinner } from './Loading';
import { Text } from './Text';

export type PinState = 'idle' | 'verifying' | 'wrong' | 'weak' | 'success' | 'locked';

interface Props {
  /** Digits typed so far. */
  pin: string;
  state: PinState;
  /** The line under the dots, and its colour. */
  message: string;
  messageColor?: string;
  /** Extra line (the countdown while waiting). */
  note?: string;
  onDigit: (d: string) => void;
  onBack: () => void;
  /** Bottom-left key (Face ID / fingerprint). Left empty when absent. */
  bio?: { icon: IconName; label: string; onPress: () => void };
  /** While the Face ID / fingerprint prompt is up: a pulsing icon replaces the dots and the keys dim. */
  bioActive?: { icon: IconName; text: string };
  /** Smaller keys, for a short landscape screen. */
  compact?: boolean;
  /** Draw only the dots and message (the keypad goes in another column). */
  part?: 'all' | 'dots' | 'keys';
}

const SUBS = ['', 'ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ'];

/** The dots, the line under them, and the fixed keypad (it never shuffles: muscle memory and screen readers rely on it). */
export function PinPad({ pin, state, message, messageColor, note, onDigit, onBack, bio, bioActive, compact, part = 'all' }: Props) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const x = useSharedValue(0);
  const wave = useSharedValue(0);
  const size = compact ? 56 : 76;
  const off = state === 'verifying' || state === 'success' || state === 'locked' || !!bioActive;
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (bioActive && !reduce) pulse.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) }), -1);
    else pulse.value = 0;
    return () => cancelAnimation(pulse);
  }, [bioActive, reduce, pulse]);
  const ring = useAnimatedStyle(() => ({ opacity: 1 - pulse.value, transform: [{ scale: 1 + pulse.value * 0.35 }] }));

  useEffect(() => {
    if (state === 'wrong' || state === 'weak') {
      if (!reduce) x.value = withSequence(withTiming(-8, { duration: 70 }), withTiming(8, { duration: 90 }), withTiming(-8, { duration: 90 }), withTiming(4, { duration: 80 }), withTiming(0, { duration: 70 }));
    }
  }, [state, reduce, x]);
  useEffect(() => {
    if (state === 'verifying' && !reduce) wave.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1);
    else cancelAnimation(wave);
    if (state !== 'verifying') wave.value = 0;
    return () => cancelAnimation(wave);
  }, [state, reduce, wave]);
  const shake = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const dotColor = state === 'wrong' ? colors.crit : state === 'weak' ? colors.warn : state === 'success' ? colors.ok : colors.accent;
  const shown = state === 'idle' ? pin.length : state === 'locked' ? 0 : PIN_LENGTH;

  const press = (d: string) => {
    Haptics.light();
    onDigit(d);
  };

  const dots = (
    <View style={styles.top}>
      {bioActive ? (
        <View accessible accessibilityLabel={bioActive.text} style={styles.bioWrap}>
          <Animated.View style={[styles.bioRing, { borderColor: colors.accent }, ring]} />
          <View style={[styles.bioCircle, { backgroundColor: colors.okSoft }]}>
            <Icon name={bioActive.icon} size={28} color={colors.accent} strokeWidth={1.8} />
          </View>
        </View>
      ) : (
      <Animated.View
        style={[styles.dots, shake]}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${state === 'idle' ? pin.length : shown} of ${PIN_LENGTH} digits entered`}
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <Dot key={i} index={i} filled={i < shown} color={dotColor} empty={colors.decoNode} wave={wave} />
        ))}
      </Animated.View>
      )}
      <View style={{ alignItems: 'center', gap: 4 }} accessibilityLiveRegion="polite">
        <View style={styles.msg}>
          {state === 'verifying' ? <Spinner size={16} color={colors.ok} /> : null}
          <Text f="body500" size={14} lh={20} color={bioActive ? colors.text2 : (messageColor ?? colors.muted)} align="center">
            {bioActive ? bioActive.text : message}
          </Text>
        </View>
        {note ? (
          <Text f="mono400" size={13} lh={18} color={colors.muted}>
            {note}
          </Text>
        ) : null}
      </View>
    </View>
  );

  const key = (content: ReactNode, label: string, onPress: () => void, opts: { outlined?: boolean; disabled?: boolean } = {}) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={opts.disabled}
      onPress={onPress}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', opacity: opts.disabled ? (bioActive ? 0.5 : 0.35) : 1 },
        opts.outlined && { borderWidth: 1, borderColor: colors.line, backgroundColor: pressed ? colors.raised : colors.surface },
        !opts.outlined && pressed && { backgroundColor: colors.raised },
      ]}
    >
      {content}
    </Pressable>
  );

  const pad = (
    <View style={[styles.grid, { width: size * 3 + (compact ? 20 : 60), rowGap: compact ? 8 : 14, columnGap: compact ? 10 : 30 }]}>
      {SUBS.map((sub, i) => (
        <View key={i}>
          {key(
            <>
              <Text f="display600" size={compact ? 24 : 28} lh={compact ? 26 : 30} color={colors.textStrong}>
                {i + 1}
              </Text>
              {!compact ? (
                <Text f="mono500" size={9} lh={11} ls={1.26} color={colors.muted} style={{ height: 11 }}>
                  {sub}
                </Text>
              ) : null}
            </>,
            String(i + 1),
            () => press(String(i + 1)),
            { outlined: true, disabled: off },
          )}
        </View>
      ))}
      <View>
        {bio
          ? key(<Icon name={bio.icon} size={compact ? 26 : 32} color={colors.accent} strokeWidth={1.7} />, bio.label, bio.onPress, { disabled: state === 'verifying' || state === 'success' })
          : <View style={{ width: size, height: size }} />}
      </View>
      <View>
        {key(
          <Text f="display600" size={compact ? 24 : 28} lh={compact ? 26 : 30} color={colors.textStrong}>
            0
          </Text>,
          '0',
          () => press('0'),
          { outlined: true, disabled: off },
        )}
      </View>
      <View>
        {key(
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7 6-7z" />
            <Path d="M17 9.5l-5 5 M12 9.5l5 5" />
          </Svg>,
          'Delete last digit',
          onBack,
          { disabled: off || pin.length === 0 },
        )}
      </View>
    </View>
  );

  if (part === 'dots') return dots;
  if (part === 'keys') return pad;
  return (
    <View style={{ alignItems: 'center', gap: compact ? 12 : 28 }}>
      {dots}
      {pad}
    </View>
  );
}

function Dot({ index, filled, color, empty, wave }: { index: number; filled: boolean; color: string; empty: string; wave: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    // A wave across the dots while verifying: each one peaks a little after the last.
    const phase = (wave.value + 1 - index * 0.1) % 1;
    const s = wave.value === 0 ? 1 : phase < 0.3 ? 1 + 0.35 * Math.sin((phase / 0.3) * Math.PI) : 1;
    return { transform: [{ scale: s }] };
  });
  return <Animated.View style={[styles.dot, { borderColor: filled ? color : empty, backgroundColor: filled ? color : 'transparent' }, style]} />;
}


const styles = StyleSheet.create({
  top: { alignItems: 'center', gap: 12, minHeight: 66 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 18, height: 22 },
  bioWrap: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  bioRing: { ...StyleSheet.absoluteFill, borderRadius: 28, borderWidth: 2 },
  bioCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  msg: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
