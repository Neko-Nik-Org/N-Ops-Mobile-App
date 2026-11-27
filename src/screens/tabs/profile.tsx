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

import { Chip, IconTile } from '@/components/Bits';
import { PressableScale } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Page';
import { PermissionSheet } from '@/components/PermissionSheet';
import { Text, type as T } from '@/components/Text';
import { Toggle } from '@/components/Toggle';
import { api, type UserProfile } from '@/lib/api';
import { disableBiometricUnlock } from '@/lib/biometricLock';
import { getBiometricInfo, unlockTitle, type BiometricInfo } from '@/lib/biometrics';
import { hostOf, workspaceLabel } from '@/lib/format';
import { resetTo } from '@/lib/nav';
import { AUTO_LOCK_OPTIONS } from '@/lib/pin';
import { loadPrefs, resetAccountPrefs, savePrefs } from '@/lib/prefs';
import { useSession } from '@/lib/session';
import { version } from '../../../package.json';
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
  const [info, setInfo] = useState<UserProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      void loadPrefs().then((p) => setBioOn(p.biometricLock));
    }, []),
  );

  useEffect(() => {
    if (session) void api.profile(session).then(setInfo).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.userId]);

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
        <View style={styles.person}>
          <View style={[styles.avatar, { backgroundImage: 'linear-gradient(135deg, #4CF2C0, #8A7CFF)' }]}>
            <Text f="display700" size={28} lh={34} color="#06281F">
              {session.user.initials}
            </Text>
          </View>
          <Text f="display600" size={22} lh={28} color={colors.textStrong} align="center">
            {session.user.displayName}
          </Text>
          <Text f="mono400" size={12} lh={16} color={colors.muted} align="center">
            {workspaceLabel(session.workspace)} · {hostOf(session.server)}
          </Text>
          {info ? (
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
              {info.canApprove ? <Chip label="Approver" tone="violet" /> : null}
              <Chip label={info.emailVerified ? 'Email verified' : 'Email not verified'} tone={info.emailVerified ? 'ok' : 'warn'} />
            </View>
          ) : null}
        </View>
      ) : null}

      {info ? (
        <>
          <Text {...T.label} color={colors.text2} style={styles.section}>
            Account
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {(
              [
                ['Email', info.email],
                ['Username', info.userName],
                ['Organization', info.organization],
              ] as const
            ).map(([label, value], i) => (
              <View key={label} style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line2 }]}>
                <Text size={14} lh={20} color={colors.muted}>
                  {label}
                </Text>
                <Text f="body500" size={14} lh={20} align="right" numberOfLines={1} style={{ flex: 1 }}>
                  {value}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Text {...T.label} color={colors.text2} style={styles.section}>
        Security
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
          <View style={{ flex: 1 }}>
            <Text f="body500" size={15} lh={20}>
              Change PIN
            </Text>
            <Text size={12} lh={16} color={colors.muted}>
              Locks after {AUTO_LOCK_OPTIONS.find((o) => o.ms === autoLock)?.label ?? 'a while'} away
            </Text>
          </View>
          <Icon name="chevronRight" size={18} color={colors.muted} />
        </PressableScale>
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
        Preferences
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
      <View style={[styles.card, { marginTop: 12, backgroundColor: colors.surface, borderColor: colors.line }]}>
        <PressableScale accessibilityLabel="Notification settings" onPress={() => void Linking.openSettings()} style={styles.row}>
          <IconTile icon="bell" tone="violet" />
          <View style={{ flex: 1 }}>
            <Text f="body500" size={15} lh={20}>
              Notifications
            </Text>
            <Text size={12} lh={16} color={colors.muted}>
              Approvals and incidents
            </Text>
          </View>
          <Icon name="chevronRight" size={18} color={colors.muted} />
        </PressableScale>
      </View>

      <View style={[styles.card, styles.note, { backgroundColor: colors.raised, borderColor: colors.line }]}>
        <Icon name="servers" size={16} color={colors.muted} />
        <Text size={12} lh={17} color={colors.text2} style={{ flex: 1 }}>
          Users, roles, permissions and tags are managed in the web admin.
        </Text>
      </View>

      <PressableScale accessibilityLabel="Sign out of this device" onPress={unlink} style={[styles.card, styles.row, { marginTop: 24, backgroundColor: colors.surface, borderColor: colors.line }]}>
        <IconTile icon="unlink" tone="crit" />
        <Text f="body600" size={15} lh={20} color={colors.critText} style={{ flex: 1 }}>
          Sign out of this device
        </Text>
      </PressableScale>
      <Text f="mono400" size={11} lh={16} color={colors.muted} align="center" style={{ marginTop: 14 }}>
        N-Ops {version}
      </Text>
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
  person: { marginTop: 22, alignItems: 'center', gap: 6 },
  note: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  avatar: { width: 84, height: 84, borderRadius: 42, marginBottom: 6, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: 24, marginBottom: 10 },
  segment: { flexDirection: 'row', padding: 4, borderRadius: radius.sm + 2, gap: 4 },
  segItem: { flex: 1, height: 40, borderRadius: radius.code, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 60, paddingHorizontal: 16, paddingVertical: 10 },
});
