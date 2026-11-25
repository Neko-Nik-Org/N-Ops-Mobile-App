import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { easeOut } from '@/theme/motion';

interface Props {
  value: boolean;
  onValueChange: (next: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

/** 51×31 switch from the "Make it yours" screen. */
export function Toggle({ value, onValueChange, accessibilityLabel, disabled }: Props) {
  const { colors } = useTheme();
  const p = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    p.value = withTiming(value ? 1 : 0, { duration: 200, easing: easeOut });
  }, [value, p]);

  const off = colors.trackOff;
  const on = colors.ok;
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], [off, on]) }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * 20 }] }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      hitSlop={8}
    >
      <Animated.View style={[styles.track, track, disabled && { opacity: 0.5 }]}>
        <Animated.View style={[styles.knob, { backgroundColor: colors.knob }, knob]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 51, height: 31, borderRadius: 16, padding: 2 },
  knob: { width: 27, height: 27, borderRadius: 14, boxShadow: '0px 2px 6px rgba(0,0,0,0.25)' },
});
