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
import { useLocalSearchParams, useRouter } from '@/lib/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { PrimaryButton, TextButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { BrandGradient, N_PATH, NODES, useSvgId } from '@/components/Logo';
import { Text, type as T } from '@/components/Text';
import { api } from '@/lib/api';
import { config } from '@/lib/config';
import { deviceInfo } from '@/lib/device';
import { ApiError, messageOf } from '@/lib/errors';
import { hostOf } from '@/lib/format';
import { normalizeServer, parseUserId } from '@/lib/linkPayload';
import { resetTo } from '@/lib/nav';
import { clearPin } from '@/lib/pin';
import { savePrefs } from '@/lib/prefs';
import { useSession } from '@/lib/session';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, radius } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const STEPS = [
  { active: 'Checking your code', done: 'Code verified' },
  { active: 'Saving device key', done: 'Device key saved securely' },
  { active: 'Syncing your workspace', done: 'Workspace synced' },
  { active: 'Opening your dashboard', done: 'Opening your dashboard' },
] as const;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function resolveServer(given?: string): string | null {
  return normalizeServer(given) ?? normalizeServer(config.defaultServer) ?? null;
}

/** Spinner ring + logo whose nodes light up in turn (the canvas "Loading" screen). */
function LinkingMark() {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const gid = useSvgId('lk');
  const spin = useSharedValue(0);
  const beat = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    spin.value = withRepeat(withTiming(360, { duration: 1400, easing: Easing.linear }), -1);
    beat.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.linear }), -1);
    return () => {
      cancelAnimation(spin);
      cancelAnimation(beat);
    };
  }, [reduce, spin, beat]);
  const ring = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));

  return (
    <View style={styles.mark}>
      <Svg width={168} height={168} style={StyleSheet.absoluteFill}>
        <Circle cx={84} cy={84} r={80} fill="none" stroke={colors.line} strokeWidth={3} />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, ring]}>
        <Svg width={168} height={168}>
          <Defs>
            <BrandGradient id={`${gid}r`} />
          </Defs>
          <Circle cx={84} cy={84} r={80} fill="none" stroke={`url(#${gid}r)`} strokeWidth={3} strokeLinecap="round" strokeDasharray={[120, 383]} />
        </Svg>
      </Animated.View>
      <Svg width={96} height={96} viewBox="0 0 160 160" style={{ position: 'absolute', left: 36, top: 36 }} accessibilityLabel="N-Ops">
        <Defs>
          <BrandGradient id={gid} />
        </Defs>
        <Rect x={3} y={3} width={154} height={154} rx={40} fill={brand.tile} stroke={`url(#${gid})`} strokeWidth={3} />
        <Path d={N_PATH} fill="none" stroke={`url(#${gid})`} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
        <G>
          {NODES.map(([cx, cy], i) => (
            <BeatNode key={`${cx}-${cy}`} cx={cx} cy={cy} beat={beat} offset={i * 0.125} stroke={`url(#${gid})`} />
          ))}
        </G>
      </Svg>
    </View>
  );
}

function BeatNode({ cx, cy, beat, offset, stroke }: { cx: number; cy: number; beat: SharedValue<number>; offset: number; stroke: string }) {
  // Each node flashes mint for a quarter of the 1.6 s cycle, 200 ms after the previous one.
  const props = useAnimatedProps(() => {
    const p = (beat.value - offset + 1) % 1;
    const k = p < 0.25 ? p / 0.25 : p < 0.5 ? 1 - (p - 0.25) / 0.25 : 0;
    return { fillOpacity: k };
  });
  return (
    <G>
      <Circle cx={cx} cy={cy} r={11} fill={brand.ink} stroke={stroke} strokeWidth={5} />
      <AnimatedCircle cx={cx} cy={cy} r={8.5} fill={brand.mint} animatedProps={props} />
    </G>
  );
}

function StepRow({ index, current, first }: { index: number; current: number; first: boolean }) {
  const { colors } = useTheme();
  const done = index < current;
  const active = index === current;
  const reduce = useReducedMotion();
  const spin = useSharedValue(0);
  useEffect(() => {
    if (!active || reduce) return;
    spin.value = withRepeat(withTiming(360, { duration: 1400, easing: Easing.linear }), -1);
    return () => cancelAnimation(spin);
  }, [active, reduce, spin]);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const label = done ? STEPS[index].done : STEPS[index].active;

  return (
    <View style={[styles.step, !first && { borderTopWidth: 1, borderTopColor: colors.line2 }]} accessibilityLabel={`${label}${done ? ', done' : active ? ', in progress' : ''}`}>
      {done ? (
        <View style={[styles.check, { backgroundColor: colors.okSoft }]}>
          <Icon name="check" size={14} color={colors.accent} strokeWidth={3} />
        </View>
      ) : active ? (
        <View style={styles.spinBox}>
          <Svg width={24} height={24} style={StyleSheet.absoluteFill}>
            <Circle cx={12} cy={12} r={9} fill="none" stroke={colors.line} strokeWidth={2.5} />
          </Svg>
          <Animated.View style={[StyleSheet.absoluteFill, spinStyle]}>
            <Svg width={24} height={24}>
              <Circle cx={12} cy={12} r={9} fill="none" stroke={colors.ok} strokeWidth={2.5} strokeLinecap="round" strokeDasharray={[16, 41]} />
            </Svg>
          </Animated.View>
        </View>
      ) : (
        <View style={[styles.pending, { borderColor: colors.line }]} />
      )}
      <Text f={active ? 'body600' : 'body400'} size={15} lh={20} color={done ? colors.text : active ? colors.textStrong : colors.muted} style={{ flex: 1 }}>
        {label}
        {active ? '…' : ''}
      </Text>
    </View>
  );
}

export default function Linking() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ code?: string; server?: string; userId?: string }>();
  const { save } = useSession();
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const started = useRef(-1);

  const server = resolveServer(params.server);
  const code = params.code ?? '';
  const userId = parseUserId(params.userId);

  const run = useCallback(async () => {
    setError(null);
    setCurrent(0);
    try {
      if (!server) throw new ApiError('no_server', 'Add your server address to link with a typed code.');
      const t0 = Date.now();
      if (userId === null) throw new ApiError('invalid_code', 'Enter the user ID shown next to the code.');
      const result = await api.linkDevice(server, userId, code, deviceInfo());
      await wait(Math.max(0, 450 - (Date.now() - t0)));
      setCurrent(1);

      const session = { server, ...result, linkedAt: new Date().toISOString() };
      await save(session);
      await savePrefs({ lastServer: server });
      await wait(450);
      setCurrent(2);

      await api.bootstrap(session);
      setCurrent(3);
      Haptics.success();
      await wait(500);

      await clearPin(); // a new link always sets a new PIN
      resetTo(router, '/pin-create');
    } catch (e) {
      Haptics.error();
      setError(messageOf(e));
    }
  }, [server, code, userId, save, router]);

  useEffect(() => {
    if (started.current === attempt) return;
    started.current = attempt;
    void run();
  }, [attempt, run]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={[styles.root, { paddingTop: insets.top + 9, paddingBottom: insets.bottom + 6 }]} bounces={false}>
      <Svg width={280} height={280} style={styles.glow} pointerEvents="none">
        <Defs>
          <RadialGradient id="lkglow" cx={140} cy={140} r={140} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={brand.mint} stopOpacity={0.12} />
            <Stop offset="0.45" stopColor={brand.violet} stopOpacity={0.07} />
            <Stop offset="0.7" stopColor={brand.violet} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={140} cy={140} r={140} fill="url(#lkglow)" />
      </Svg>

      <View style={{ marginTop: 111 }}>
        <LinkingMark />
      </View>

      <View style={styles.titles}>
        <Text {...T.titleXs} color={colors.textStrong} align="center" accessibilityRole="header">
          {error ? "Couldn't link this phone" : 'Linking this phone'}
        </Text>
        <Text {...T.bodySm} color={colors.muted} align="center">
          {error ?? 'Hang tight, this only takes a moment.'}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorActions}>
          <PrimaryButton label="Try again" icon="refresh" iconPosition="left" onPress={() => setAttempt((a) => a + 1)} />
          <TextButton label="Back to the code" color={colors.accent} onPress={() => (router.canGoBack() ? router.back() : router.replace('/scan'))} />
        </View>
      ) : (
        <View style={[styles.steps, { backgroundColor: colors.surface, borderColor: colors.line }]} accessibilityLiveRegion="polite">
          {STEPS.map((_, i) => (
            <StepRow key={i} index={i} current={current} first={i === 0} />
          ))}
        </View>
      )}

      <View style={{ height: 24 }} />
      <View style={[styles.server, { borderColor: colors.line }]}>
        <View style={[styles.serverIcon, { backgroundColor: colors.surface }]}>
          <Icon name="servers" size={18} color={colors.violetText} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text {...T.caption} color={colors.muted}>
            Connecting to
          </Text>
          <Text f="mono400" size={14} lh={19}>
            {server ? hostOf(server) : 'No server set'}
          </Text>
        </View>
        <Icon name="lock" size={18} color={colors.accent} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1, paddingHorizontal: 24, alignItems: 'center' },
  glow: { position: 'absolute', top: 120, alignSelf: 'center', opacity: 1 },
  mark: { width: 168, height: 168 },
  titles: { marginTop: 40, gap: 8, alignItems: 'center' },
  steps: { marginTop: 36, alignSelf: 'stretch', paddingHorizontal: 18, paddingVertical: 6, borderRadius: radius.card, borderWidth: 1 },
  step: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  spinBox: { width: 24, height: 24 },
  pending: { width: 20, height: 20, margin: 2, borderRadius: 10, borderWidth: 2 },
  errorActions: { marginTop: 32, alignSelf: 'stretch', gap: 8 },
  server: {
    marginTop: 'auto',
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.button,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  serverIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
