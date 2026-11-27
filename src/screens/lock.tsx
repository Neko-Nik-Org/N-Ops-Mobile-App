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

import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconTile } from '@/components/Bits';
import { PrimaryButton, SecondaryButton, TextButton } from '@/components/Buttons';
import { LogoMark } from '@/components/Logo';
import { PinPad, type PinState } from '@/components/PinPad';
import { Text, type as T } from '@/components/Text';
import { api } from '@/lib/api';
import { getBiometricInfo, type BiometricInfo } from '@/lib/biometrics';
import { biometricUnlock, disableBiometricUnlock } from '@/lib/biometricLock';
import { workspaceLabel } from '@/lib/format';
import { Haptics } from '@/lib/haptics';
import { resetTo } from '@/lib/nav';
import { PIN_LENGTH, triesLeft, verifyPin, waitLeftMs } from '@/lib/pin';
import { loadPrefs, resetAccountPrefs, savePrefs } from '@/lib/prefs';
import { useLocalSearchParams, useRouter } from '@/lib/router';
import { useSession } from '@/lib/session';
import { useColumn } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { brand } from '@/theme/tokens';

const clock = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * Unlock with PIN. Face ID / fingerprint is offered first (if it's on); cancelling shows the keypad.
 * 3 wrong PINs: wait 5 minutes (biometrics still work). 9 wrong in total: the phone unlinks itself.
 * `resume=1` means we were opened over the screen the user left, so success goes back to it.
 */
export default function Lock() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { land } = useColumn();
  const { session, clear } = useSession();
  const { resume } = useLocalSearchParams<{ resume?: string }>();
  const [pin, setPin] = useState('');
  const [state, setState] = useState<PinState>('idle');
  const [left, setLeft] = useState<number | null>(null);
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [bio, setBio] = useState<BiometricInfo | null>(null);
  const [bioOn, setBioOn] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [notice, setNotice] = useState('');
  const [unlinking, setUnlinking] = useState(false);
  const busy = useRef(false);

  // The keypad is the only way past this screen; Android back must not skip it.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const finish = useCallback(async () => {
    Haptics.success();
    setState('success');
    await new Promise<void>((r) => setTimeout(r, 400));
    if (resume && router.canGoBack()) return router.back();
    const prefs = await loadPrefs();
    resetTo(router, prefs.setupDone ? '/home' : '/setup');
  }, [resume, router]);

  const unlinkNow = useCallback(async () => {
    setUnlinking(true);
    if (session) await api.unlink(session).catch(() => undefined);
    await clear();
    await resetAccountPrefs();
    resetTo(router, '/scan');
  }, [session, clear, router]);

  const tryBio = useCallback(
    async (info: BiometricInfo) => {
      if (!info.available || busy.current) return;
      busy.current = true;
      const r = await biometricUnlock('Unlock N-Ops');
      busy.current = false;
      if (r === 'ok') return void finish();
      if (r === 'changed') {
        // A face or finger was added to the phone: biometrics are off until the PIN turns them back on.
        await disableBiometricUnlock();
        await savePrefs({ biometricLock: false });
        setBioOn(false);
        setNotice(`${info.label} was changed on this phone, so it's off. Enter your PIN. You can turn it back on in Profile.`);
      }
    },
    [finish],
  );

  useEffect(() => {
    void (async () => {
      const [info, prefs, wait, tries] = await Promise.all([getBiometricInfo(), loadPrefs(), waitLeftMs(), triesLeft()]);
      setBio(info);
      setBioOn(prefs.biometricLock && info.available);
      setLeft(tries);
      if (wait > 0) {
        setUntil(Date.now() + wait);
        setState('locked');
      }
      if (prefs.biometricLock) void tryBio(info);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown while waiting.
  useEffect(() => {
    if (state !== 'locked') return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= until) {
        setState('idle');
        void triesLeft().then(setLeft);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [state, until]);

  const submit = async (typed: string) => {
    setState('verifying');
    const [r] = await Promise.all([verifyPin(typed), new Promise<void>((res) => setTimeout(res, 350))]); // never flicker
    if (r.ok) return void finish();
    Haptics.error();
    setPin('');
    if (r.reason === 'unlink') return void unlinkNow();
    if (r.reason === 'locked') {
      setUntil(Date.now() + r.waitMs);
      setNow(Date.now());
      return setState('locked');
    }
    setLeft(r.triesLeft);
    setState('wrong');
    setTimeout(() => setState((s) => (s === 'wrong' ? 'idle' : s)), 900);
  };

  const onDigit = (d: string) => {
    if (state === 'verifying' || state === 'success' || state === 'locked') return;
    const next = (state === 'wrong' ? '' : pin) + d;
    if (state === 'wrong') setState('idle');
    setPin(next);
    if (next.length === PIN_LENGTH) void submit(next);
  };

  const name = session?.user.firstName;
  const message =
    state === 'wrong'
      ? `Wrong PIN · ${left} ${left === 1 ? 'attempt' : 'attempts'} left`
      : state === 'verifying'
        ? 'Unlocking…'
        : state === 'success'
          ? 'Unlocked'
          : state === 'locked'
            ? 'Too many attempts'
            : 'Enter your PIN';
  const messageColor = state === 'wrong' || state === 'locked' ? colors.critText : state === 'success' ? colors.accent : state === 'verifying' ? colors.text2 : colors.muted;
  const bioKey = bioOn && bio ? { icon: bio.kind === 'fingerprint' ? ('fingerprint' as const) : ('faceId' as const), label: `Unlock with ${bio.label}`, onPress: () => void tryBio(bio) } : undefined;

  const who = (
    <View style={{ alignItems: 'center' }}>
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundImage: brand.gradientDiagonal }]}>
          <Text f="display700" size={22} lh={26} color="#06281F">
            {session?.user.initials ?? ''}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.bg }]}>
          <LogoMark size={22} />
        </View>
      </View>
      <Text {...T.titleXs} color={colors.textStrong} align="center" style={{ marginTop: 18 }} accessibilityRole="header">
        {name ? `Welcome back, ${name}` : 'Welcome back'}
      </Text>
      {session ? (
        <View style={[styles.chip, { backgroundColor: colors.raised }]}>
          <Text f="mono400" size={13} lh={18}>
            {workspaceLabel(session.workspace)}
          </Text>
        </View>
      ) : null}
    </View>
  );

  const pad = (part: 'all' | 'dots' | 'keys') => (
    <PinPad
      pin={pin}
      state={state}
      message={message}
      messageColor={messageColor}
      note={state === 'locked' ? `Try again in ${clock(Math.max(0, until - now))}` : notice || undefined}
      onDigit={onDigit}
      onBack={() => setPin((p) => p.slice(0, -1))}
      bio={bioKey}
      compact={land}
      part={part}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 12 }]} bounces={false} keyboardShouldPersistTaps="handled">
        {land ? (
          <View style={styles.landRow}>
            <View style={{ flex: 1, alignItems: 'center', gap: 20 }}>
              {who}
              {pad('dots')}
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>{pad('keys')}</View>
          </View>
        ) : (
          <View style={{ alignItems: 'center', gap: 28 }}>
            {who}
            {pad('all')}
          </View>
        )}
        <View style={{ marginTop: 'auto', paddingTop: 12 }}>
          <TextButton label="Forgot PIN?" color={colors.muted} size={14} onPress={() => setForgot(true)} />
        </View>
      </ScrollView>

      <Modal transparent animationType="fade" visible={forgot} onRequestClose={() => setForgot(unlinking)} supportedOrientations={['portrait', 'landscape']}>
        <Pressable style={[styles.scrim, { backgroundColor: colors.sheetScrim }]} onPress={() => !unlinking && setForgot(false)} accessibilityLabel="Close" />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 24 }]} accessibilityViewIsModal>
          <View style={[styles.grab, { backgroundColor: colors.line }]} />
          <View style={{ marginTop: 10 }}>
            <IconTile icon="unlink" tone="crit" size={48} iconSize={22} radius={14} />
          </View>
          <Text f="display600" size={22} lh={28} ls={-0.22} color={colors.textStrong} accessibilityRole="header">
            Forgot your PIN?
          </Text>
          <Text size={15} lh={22} color={colors.muted}>
            For your security, N-Ops will unlink this phone and clear its data. Scan a new QR code from your admin panel to sign in again and set a new PIN.
          </Text>
          <View style={{ gap: 10, marginTop: 6 }}>
            <PrimaryButton label="Unlink and sign in again" tone="danger" loading={unlinking} onPress={() => void unlinkNow()} />
            <SecondaryButton label="Cancel" onPress={() => !unlinking && setForgot(false)} />
            {bioKey ? (
              <TextButton
                label={`Use ${bio?.label} instead`}
                color={colors.accent}
                size={14}
                onPress={() => {
                  setForgot(false);
                  if (bio) void tryBio(bio);
                }}
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 24, alignItems: 'center' },
  landRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 24 },
  avatarWrap: { width: 64, height: 64 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: -6, bottom: -6, borderRadius: 9, borderWidth: 3 },
  chip: { marginTop: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  scrim: { ...StyleSheet.absoluteFill },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 12, paddingHorizontal: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28, gap: 14, maxWidth: 560, alignSelf: 'center', width: '100%' },
  grab: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3 },
});
