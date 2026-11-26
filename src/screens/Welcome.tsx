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

import { useRouter } from '@/lib/router';
import { useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OutlineIconButton, PrimaryButton, TextButton } from '@/components/Buttons';
import { StepProgress } from '@/components/Bits';
import { LogoMark } from '@/components/Logo';
import { Text, type as T } from '@/components/Text';
import { ApprovalArt, AlertsArt, ART_H, ART_W, FleetArt, TrustArt } from '@/components/WelcomeArt';
import { savePrefs } from '@/lib/prefs';
import { useColumn } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';

interface Page {
  eyebrow: string;
  title: string;
  body: string;
  art: ReactNode;
}

const pages: Page[] = [
  {
    eyebrow: 'WELCOME TO N-OPS',
    title: 'Step away.\nStay in control.',
    body: 'Health, approvals and alerts for every server you run, right on your phone.',
    art: <FleetArt />,
  },
  {
    eyebrow: '02 — APPROVALS',
    title: 'Sign off from\nanywhere.',
    body: 'When a teammate needs a second pair of eyes on a sensitive action, review it and approve or deny in a tap.',
    art: <ApprovalArt />,
  },
  {
    eyebrow: '03 — ALERTS',
    title: 'Know before your users do.',
    body: 'Server alerts, workflow results and Vault changes reach you the moment they happen, with the audit trail one tap away.',
    art: <AlertsArt />,
  },
  {
    eyebrow: '04 — SIGN IN',
    title: 'No passwords.\nJust this phone.',
    body: "Scan the QR code in your N-Ops admin panel and you're in. Nothing to type, nothing to forget.",
    art: <TrustArt />,
  },
];

const LAST = pages.length - 1;

export default function Welcome() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { W, H, land } = useColumn();
  const scroller = useRef<Animated.ScrollView>(null);
  const position = useSharedValue(0);
  const [index, setIndex] = useState(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    position.value = e.contentOffset.x / W;
  });

  const top = insets.top + 9;
  const bottom = insets.bottom + 6;
  // Everything except the illustration: header, progress, gaps, text block, button.
  const fixed = top + 44 + 16 + 20 + 28 + 184 + 16 + 56 + bottom;
  // Landscape phone: art sits beside the copy, so only the chrome above/below it counts.
  const artScale = land
    ? Math.max(0.4, Math.min(1, (H - top - bottom - 44 - 12 - 8 - 16 - 56 - 40) / ART_H, (W / 2 - 36) / ART_W))
    : Math.max(0.62, Math.min(1, (H - fixed) / ART_H, (W - 48) / ART_W));

  const goTo = (i: number) => {
    scroller.current?.scrollTo({ x: i * W, animated: true });
    setIndex(i);
  };

  const finish = async () => {
    await savePrefs({ onboardingSeen: true });
    router.push('/scan');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: top, paddingBottom: bottom }]}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <LogoMark size={28} />
          <Text f="display700" size={18} lh={22} ls={-0.18} color={colors.textStrong}>
            N-Ops
          </Text>
        </View>
        {index < LAST ? <TextButton label="Skip" onPress={() => void finish()} /> : null}
      </View>
      <View style={styles.progress}>
        <StepProgress count={pages.length} position={position} />
      </View>

      <Animated.ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / W))}
        style={styles.pager}
      >
        {pages.map((p, i) => (
          <View key={p.eyebrow} style={{ width: W, paddingHorizontal: 24, flexDirection: land ? 'row' : 'column', alignItems: land ? 'center' : undefined, gap: land ? 24 : 0 }} accessibilityLabel={`Step ${i + 1} of ${pages.length}`}>
            <View style={{ height: ART_H * artScale, flex: land ? 1 : undefined, marginTop: land ? 0 : 20, alignItems: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={{ width: ART_W, height: ART_H, transform: [{ scale: artScale }], transformOrigin: 'top' }}>{p.art}</View>
            </View>
            <View style={[styles.copy, land && { flex: 1, marginTop: 0 }]}>
              <Text {...T.eyebrow} color={colors.accent}>
                {p.eyebrow}
              </Text>
              <Text {...T.title} color={colors.textStrong} accessibilityRole="header">
                {p.title}
              </Text>
              <Text {...T.body} color={colors.muted}>
                {p.body}
              </Text>
            </View>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={styles.actions}>
        {index > 0 ? <OutlineIconButton icon="arrowLeft" accessibilityLabel="Back" onPress={() => goTo(index - 1)} /> : null}
        {index < LAST ? (
          <PrimaryButton label="Next" icon="arrowRight" onPress={() => goTo(index + 1)} />
        ) : (
          <PrimaryButton label="Link this phone" icon="qrScan" iconPosition="left" onPress={() => void finish()} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { height: 44, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progress: { paddingHorizontal: 24, marginTop: 12 },
  pager: { flex: 1 },
  copy: { marginTop: 28, gap: 12 },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingTop: 16 },
});
