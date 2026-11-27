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

import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, TextButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { Wordmark } from '@/components/Bits';
import { LogoMark } from '@/components/Logo';
import { PinPad, type PinState } from '@/components/PinPad';
import { Text, type as T } from '@/components/Text';
import { Haptics } from '@/lib/haptics';
import { resetTo } from '@/lib/nav';
import { enableBiometricUnlock } from '@/lib/biometricLock';
import { PIN_LENGTH, setPin as savePin, verifyPin, weakPinReason } from '@/lib/pin';
import { loadPrefs, savePrefs } from '@/lib/prefs';
import { useLocalSearchParams, useRouter } from '@/lib/router';
import { useColumn } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';

type Problem = null | 'weak' | 'mismatch' | 'current';

/**
 * Create a PIN right after linking: pick it, type it again, done. Easy PINs (000000, 123456, 112233...) are refused.
 * `change=1` (Profile → Change PIN) first asks for the current PIN.
 */
export default function PinCreate() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { land } = useColumn();
  const { change, bio } = useLocalSearchParams<{ change?: string; bio?: string }>();
  const verifyFirst = !!(change || bio);
  const [step, setStep] = useState<'current' | 'create' | 'confirm'>(verifyFirst ? 'current' : 'create');
  const total = bio ? 1 : change ? 3 : 2;
  const [first, setFirst] = useState('');
  const [pin, setPin] = useState('');
  const [problem, setProblem] = useState<Problem>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const confirm = step === 'confirm';
  const stepNo = bio ? 1 : (change ? 1 : 0) + (step === 'current' ? 0 : step === 'create' ? 1 : 2) || 1;
  const state: PinState = done ? 'success' : problem === 'weak' ? 'weak' : problem === 'mismatch' || problem === 'current' ? 'wrong' : 'idle';

  const onDigit = async (d: string) => {
    if (done || saving) return;
    const next = (problem ? '' : pin) + d;
    setProblem(null);
    if (next.length < PIN_LENGTH) return setPin(next);
    if (step === 'current') {
      setSaving(true);
      const r = await verifyPin(next);
      setSaving(false);
      setPin('');
      if (r.ok && bio) {
        // PIN confirmed: now bind Face ID / fingerprint to the faces and fingers on the phone.
        setSaving(true);
        const on = await enableBiometricUnlock('Turn on biometric unlock');
        setSaving(false);
        if (!on) return router.back();
        await savePrefs({ biometricLock: true });
        Haptics.success();
        return setDone(true);
      }
      if (r.ok) return setStep('create');
      Haptics.error();
      // Too many wrong tries (or the PIN is gone): the lock screen owns the wait and the unlink.
      if (r.reason !== 'wrong') return router.replace('/lock');
      return setProblem('current');
    }
    if (!confirm) {
      const weak = weakPinReason(next);
      if (weak) {
        Haptics.warning();
        setProblem('weak');
        return setPin('');
      }
      setFirst(next);
      setPin('');
      return setStep('confirm');
    }
    if (next !== first) {
      Haptics.error();
      setProblem('mismatch');
      return setPin('');
    }
    setPin(next);
    setSaving(true);
    await savePin(next);
    Haptics.success();
    setSaving(false);
    setDone(true);
  };

  const next = async () => {
    if (change || bio) return router.back();
    const prefs = await loadPrefs();
    resetTo(router, prefs.setupDone ? '/home' : '/setup');
  };

  const message = done
    ? bio ? 'Biometric unlock is on' : change ? 'PIN changed' : 'PIN set'
    : problem === 'current'
      ? 'Wrong PIN. Try again.'
      : step === 'current'
        ? 'Enter your current PIN'
        : problem === 'mismatch'
      ? "PINs didn't match. Try again."
      : problem === 'weak'
        ? 'Too easy to guess. Try another PIN.'
        : confirm
          ? 'Enter the same 6 digits again'
          : 'Avoid birthdays and repeated digits';
  const messageColor = done ? colors.accent : problem === 'mismatch' || problem === 'current' ? colors.critText : problem === 'weak' ? colors.warnText : colors.muted;

  const pad = (part: 'all' | 'dots' | 'keys') => (
    <PinPad pin={pin} state={state} message={message} messageColor={messageColor} onDigit={(d) => void onDigit(d)} onBack={() => setPin((p) => p.slice(0, -1))} compact={land} part={part} />
  );

  const title = done ? (bio ? 'Biometric unlock is on' : change ? 'PIN changed' : "You're all set") : step === 'current' ? (bio ? 'Enter your PIN' : 'Enter your current PIN') : confirm ? 'Confirm your PIN' : 'Create your PIN';
  const body = done ? "You'll use the new PIN to open N-Ops on this phone." : step === 'current' ? (bio ? 'To turn on biometric unlock, first prove it\u2019s you.' : 'To change your PIN, first prove it\u2019s you.') : confirm ? 'Type it once more so we know it\u2019s right.' : "6 digits to open N-Ops on this phone. You can use Face ID too, once it's set.";

  const copy = (
    <View style={{ gap: 8 }}>
      <Text {...T.titleSm} color={colors.textStrong} accessibilityRole="header">
        {title}
      </Text>
      <Text {...T.body} color={colors.muted}>
        {body}
      </Text>
    </View>
  );

  const footer = done ? (
    <PrimaryButton label={change || bio ? 'Done' : 'Continue'} icon={change || bio ? undefined : 'arrowRight'} onPress={() => void next()} />
  ) : (
    <View style={{ gap: 4 }}>
      {confirm ? (
        <TextButton
          label="Start over"
          color={colors.accent}
          size={14}
          onPress={() => {
            setStep('create');
            setFirst('');
            setPin('');
            setProblem(null);
          }}
        />
      ) : null}
      <View style={styles.note}>
        <Icon name="lock" size={15} color={colors.muted} strokeWidth={2} />
        <Text size={13} lh={18} color={colors.muted}>
          Saved only on this phone, never sent to the server
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 9, paddingBottom: insets.bottom + 12 }]} bounces={false}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <LogoMark size={28} />
            <Wordmark />
          </View>
          <Text f="mono400" size={12} lh={16} color={colors.muted}>
            {`Step ${done ? total : stepNo} of ${total}`}
          </Text>
        </View>
        <View style={styles.segs} accessibilityRole="progressbar" accessibilityLabel={`Step ${done ? total : stepNo} of ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <View key={i} style={[styles.seg, { backgroundColor: i < (done ? total : stepNo) ? colors.ok : colors.line }]} />
          ))}
        </View>

        {land ? (
          <View style={styles.landRow}>
            <View style={{ flex: 1, gap: 24 }}>
              {copy}
              {pad('dots')}
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>{pad('keys')}</View>
          </View>
        ) : (
          <View style={{ marginTop: 32, gap: 32 }}>
            {copy}
            {pad('all')}
          </View>
        )}

        <View style={{ marginTop: 'auto', paddingTop: 16 }}>{footer}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 24 },
  header: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  segs: { flexDirection: 'row', gap: 6, marginTop: 12 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  landRow: { flexDirection: 'row', alignItems: 'center', gap: 24, marginTop: 16 },
  note: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
