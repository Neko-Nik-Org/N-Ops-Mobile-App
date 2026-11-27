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

import { useFocusEffect, useRouter } from '@/lib/router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';

import { IconTile } from '@/components/Bits';
import { PressableScale } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Page';
import { PermissionSheet } from '@/components/PermissionSheet';
import { Text, type as T } from '@/components/Text';
import { Toggle } from '@/components/Toggle';
import { api } from '@/lib/api';
import { disableBiometricUnlock } from '@/lib/biometricLock';
import { getBiometricInfo, unlockTitle, type BiometricInfo } from '@/lib/biometrics';
import { hostOf, workspaceLabel } from '@/lib/format';
import { resetTo } from '@/lib/nav';
import { AUTO_LOCK_OPTIONS } from '@/lib/pin';
import { loadPrefs, resetAccountPrefs, savePrefs } from '@/lib/prefs';
import { useSession } from '@/lib/session';
import { useTheme } from '@/theme/ThemeProvider';
import type { ThemePref } from '@/theme/tokens';
import { radius } from '@/theme/tokens';

/** Profile and settings: appearance, auto-lock, PIN and Face ID, notifications, and unlinking this phone. */
export default function Profile() {
  const router = useRouter();
  const { colors, pref, setPref } = useTheme();
  const { session, clear } = useSession();
  const [bio, setBio] = useState<BiometricInfo | null>(null);
  const [bioOn, setBioOn] = useState(false);
  const [autoLock, setAutoLock] = useState<number>(60_000);
  const [explainBio, setExplainBio] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadPrefs().then((p) => setBioOn(p.biometricLock));
    }, []),
  );

  useEffect(() => {
    void getBiometricInfo().then(setBio);
    void loadPrefs().then((p) => {
      setBioOn(p.biometricLock);
      setAutoLock(p.autoLockMs);
    });
  }, []);

  const toggleBio = async (next: boolean) => {
    if (next) return setExplainBio(true); // explain first, then ask for the PIN
    await disableBiometricUnlock();
    setBioOn(false);
    await savePrefs({ biometricLock: false });
  };

  const unlink = () => {
    Alert.alert('Unlink this phone?', "You'll need to scan a new QR code from your admin panel to use N-Ops here again.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unlink',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            if (session) await api.unlink(session).catch(() => undefined);
            await clear();
            await resetAccountPrefs();
            resetTo(router, '/scan');
          })(),
      },
    ]);
  };

  const options: Array<{ key: ThemePref; label: string }> = [
    { key: 'system', label: 'System' },
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
  ];

  return (
    <Screen title="Profile">

      {session ? (
        <View style={[styles.card, styles.person, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={[styles.avatar, { backgroundImage: 'linear-gradient(135deg, #4CF2C0, #8A7CFF)' }]}>
            <Text f="display700" size={18} lh={22} color="#06281F">
              {session.user.initials}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text f="body600" size={16} lh={22}>
              {session.user.displayName}
            </Text>
            <Text f="mono400" size={12} lh={16} color={colors.muted}>
              {workspaceLabel(session.workspace)} · {hostOf(session.server)}
            </Text>
          </View>
        </View>
      ) : null}

      <Text {...T.label} color={colors.text2} style={styles.section}>
        Appearance
      </Text>
      <View style={[styles.segment, { backgroundColor: colors.raised }]} accessibilityRole="radiogroup">
        {options.map((o) => {
          const on = pref === o.key;
          return (
            <PressableScale
              key={o.key}
              accessibilityRole="button"
              accessibilityLabel={`${o.label} appearance`}
              accessibilityState={{ selected: on }}
              onPress={() => setPref(o.key)}
              style={[styles.segItem, on && { backgroundColor: colors.surface, boxShadow: colors.shadowSm }]}
            >
              <Text f={on ? 'body600' : 'body500'} size={14} lh={18} color={on ? colors.textStrong : colors.muted}>
                {o.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      <Text {...T.label} color={colors.text2} style={styles.section}>
        Auto-lock
      </Text>
      <View style={[styles.segment, { backgroundColor: colors.raised }]} accessibilityRole="radiogroup">
        {AUTO_LOCK_OPTIONS.map((o) => {
          const on = autoLock === o.ms;
          return (
            <PressableScale
              key={o.ms}
              accessibilityRole="button"
              accessibilityLabel={`Auto-lock: ${o.label}`}
              accessibilityState={{ selected: on }}
              onPress={() => {
                setAutoLock(o.ms);
                void savePrefs({ autoLockMs: o.ms });
              }}
              style={[styles.segItem, on && { backgroundColor: colors.surface, boxShadow: colors.shadowSm }]}
            >
              <Text f={on ? 'body600' : 'body500'} size={13} lh={18} color={on ? colors.textStrong : colors.muted} numberOfLines={1}>
                {o.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      <Text {...T.label} color={colors.text2} style={styles.section}>
        Security and alerts
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        {bio?.available ? (
          <View style={styles.row}>
            <IconTile icon="faceId" tone="ok" iconSize={18} strokeWidth={1.8} />
            <Text f="body500" size={15} lh={20} style={{ flex: 1 }}>
              {unlockTitle(bio)}
            </Text>
            <Toggle value={bioOn} onValueChange={(v) => void toggleBio(v)} accessibilityLabel={unlockTitle(bio)} />
          </View>
        ) : null}
        <PressableScale
          accessibilityLabel="Change PIN"
          onPress={() => router.push({ pathname: '/pin-create', params: { change: '1' } })}
          style={[styles.row, bio?.available && { borderTopWidth: 1, borderTopColor: colors.line2 }]}
        >
          <IconTile icon="lock" tone="ok" />
          <Text f="body500" size={15} lh={20} style={{ flex: 1 }}>
            Change PIN
          </Text>
          <Icon name="chevronRight" size={18} color={colors.muted} />
        </PressableScale>
        <PressableScale accessibilityLabel="Notification settings" onPress={() => void Linking.openSettings()} style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.line2 }]}>
          <IconTile icon="bell" tone="violet" />
          <Text f="body500" size={15} lh={20} style={{ flex: 1 }}>
            Notification settings
          </Text>
          <Icon name="chevronRight" size={18} color={colors.muted} />
        </PressableScale>
      </View>

      <PressableScale accessibilityLabel="Sign out of this device" onPress={unlink} style={[styles.card, styles.row, { marginTop: 24, backgroundColor: colors.surface, borderColor: colors.line }]}>
        <IconTile icon="unlink" tone="crit" />
        <Text f="body600" size={15} lh={20} color={colors.critText} style={{ flex: 1 }}>
          Sign out of this device
        </Text>
      </PressableScale>
      <PermissionSheet
        kind="biometrics"
        visible={explainBio}
        onCancel={() => setExplainBio(false)}
        onContinue={() => {
          setExplainBio(false);
          router.push({ pathname: '/pin-create', params: { bio: '1' } });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, borderWidth: 1, overflow: 'hidden' },
  person: { marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: 24, marginBottom: 10 },
  segment: { flexDirection: 'row', padding: 4, borderRadius: radius.sm + 2, gap: 4 },
  segItem: { flex: 1, height: 40, borderRadius: radius.code, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 60, paddingHorizontal: 16, paddingVertical: 10 },
});
