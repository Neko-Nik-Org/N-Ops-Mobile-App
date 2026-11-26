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

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { brand, durations, radius } from '@/theme/tokens';
import { easeOut } from '@/theme/motion';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps {
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'switch';
  accessibilityState?: { disabled?: boolean; checked?: boolean; selected?: boolean };
  hitSlop?: number;
}

/** Pressable with the 150 ms press-in scale used on every tappable element. */
export function PressableScale({ onPress, disabled, style, children, accessibilityRole = 'button', hitSlop, ...a11y }: PressableScaleProps) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: !!disabled, ...a11y.accessibilityState }}
      accessibilityLabel={a11y.accessibilityLabel}
      accessibilityHint={a11y.accessibilityHint}
      onPressIn={() => {
        s.value = withTiming(0.97, { duration: durations.tap, easing: easeOut });
      }}
      onPressOut={() => {
        s.value = withTiming(1, { duration: durations.tap, easing: easeOut });
      }}
      style={[style, anim]}
    >
      {children}
    </AnimatedPressable>
  );
}

interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** `mint` forces the brand mint in both themes (used over the camera). */
  tone?: 'default' | 'mint';
}

/** 56 px main action. Mint on dark, ink on light. */
export function PrimaryButton({ label, onPress, icon, iconPosition = 'right', disabled, style, tone = 'default' }: PrimaryButtonProps) {
  const { colors } = useTheme();
  const mint = tone === 'mint';
  const fg = disabled ? colors.disabledText : mint ? brand.onMint : colors.onPrimary;
  const bg = disabled ? colors.disabledBg : mint ? brand.mint : colors.primary;
  const iconEl = icon ? <Icon name={icon} size={icon === 'arrowRight' ? 18 : 20} color={fg} strokeWidth={icon === 'arrowRight' ? 2.2 : 2} /> : null;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      style={[styles.primary, { backgroundColor: bg }, style]}
    >
      {iconPosition === 'left' && iconEl}
      <Text f="body600" size={16} color={fg}>
        {label}
      </Text>
      {iconPosition === 'right' && iconEl}
    </PressableScale>
  );
}

/** 56×56 outlined square (Back on the welcome screens). */
export function OutlineIconButton({ icon, onPress, accessibilityLabel }: { icon: IconName; onPress?: () => void; accessibilityLabel: string }) {
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} accessibilityLabel={accessibilityLabel} style={[styles.square, { borderColor: colors.line }]}>
      <Icon name={icon} size={20} color={colors.text} strokeWidth={2.2} />
    </PressableScale>
  );
}

/** 52 px secondary action on a raised background ("Can't scan? Type the code"). */
export function SecondaryButton({ label, icon, onPress }: { label: string; icon?: IconName; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={[styles.secondary, { borderColor: colors.line, backgroundColor: colors.raised }]}>
      {icon ? <Icon name={icon} size={20} color={colors.text} strokeWidth={1.8} /> : null}
      <Text f="body600" size={15} color={colors.text}>
        {label}
      </Text>
    </PressableScale>
  );
}

/** 44 px plain text action. */
export function TextButton({ label, onPress, color, size = 15 }: { label: string; onPress?: () => void; color?: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={styles.text}>
      <Text f="body600" size={size} color={color ?? colors.muted}>
        {label}
      </Text>
    </PressableScale>
  );
}

/** 44 px card actions (Approve / Review / Deny). */
export function SmallButton({
  label,
  variant,
  onPress,
  disabled,
}: {
  label: string;
  variant: 'primary' | 'outline';
  onPress?: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const primary = variant === 'primary';
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      style={[
        styles.small,
        primary ? { backgroundColor: colors.primary } : { borderWidth: 1, borderColor: colors.line },
        disabled && { opacity: 0.6 },
      ]}
    >
      <Text f="body600" size={14} color={primary ? colors.onPrimary : colors.text}>
        {label}
      </Text>
    </PressableScale>
  );
}

/** Circular 44 px icon button (top bars). */
export function RoundIconButton({
  icon,
  onPress,
  accessibilityLabel,
  background,
  color,
  selected,
}: {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  background: string;
  color: string;
  selected?: boolean;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={selected === undefined ? undefined : { selected }}
      style={[styles.round, { backgroundColor: background }]}
    >
      <Icon name={icon} size={20} color={color} strokeWidth={icon === 'chevronLeft' ? 2.2 : 2} />
    </PressableScale>
  );
}

export function Row({ children, gap = 12, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', gap }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  primary: {
    height: 56,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexGrow: 1,
  },
  square: {
    width: 56,
    height: 56,
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    height: 52,
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  text: { height: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  small: { flex: 1, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
