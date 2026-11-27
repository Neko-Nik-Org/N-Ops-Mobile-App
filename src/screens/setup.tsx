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
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconTile } from '@/components/Bits';
import { PrimaryButton, TextButton } from '@/components/Buttons';
import { Icon, type IconName } from '@/components/Icon';
import { Text, type as T } from '@/components/Text';
import { Toggle } from '@/components/Toggle';
import { api } from '@/lib/api';
import { workspaceLabel } from '@/lib/format';
import { getBiometricInfo, unlockTitle, type BiometricInfo } from '@/lib/biometrics';
import { enableBiometricUnlock } from '@/lib/biometricLock';
import { resetTo } from '@/lib/nav';
import { enableNotifications } from '@/lib/notifications';
import { defaultNotificationPrefs, loadPrefs, savePrefs, type NotificationPrefs } from '@/lib/prefs';
import { useSession } from '@/lib/session';
import { useTheme } from '@/theme/ThemeProvider';
import { easeOut } from '@/theme/motion';
import { radius } from '@/theme/tokens';

const rows: Array<{ key: keyof NotificationPrefs; title: string; desc: string; icon: IconName; tone: 'violet' | 'crit' | 'warn' | 'ok' }> = [
  { key: 'approvals', title: 'Approvals waiting on me', desc: 'Sign-offs your team needs', icon: 'shieldCheck', tone: 'violet' },
  { key: 'critical', title: 'Critical alerts', desc: 'Down servers, full disks', icon: 'alertTriangle', tone: 'crit' },
  { key: 'workflows', title: 'Workflow failures', desc: 'Failed or timed-out runs', icon: 'workflow', tone: 'warn' },
  { key: 'vault', title: 'Vault changes', desc: 'Secrets added or rotated', icon: 'lock', tone: 'ok' },
];

/** "Make it yours": shown once, right after the first successful link. */
export default function Setup() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultNotificationPrefs);
  const [bio, setBio] = useState<BiometricInfo | null>(null);
  const [bioOn, setBioOn] = useState(true); // on by default; asked for once when finishing
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadPrefs().then((p) => {
      setPrefs(p.notifications);
    });
    void getBiometricInfo().then(setBio);
  }, []);

  const toggleBio = async (next: boolean) => {
    setBioOn(next);
  };

  const finish = async (withNotifications: boolean) => {
    if (!session) return resetTo(router, '/scan');
    setBusy(true);
    // Turning it on proves the user can pass the check, and binds it to the faces/fingers on the phone now.
    const lock = !!bio?.available && bioOn && (await enableBiometricUnlock(`Use ${bio.label} for N-Ops`));
    await savePrefs({ notifications: prefs, biometricLock: lock, setupDone: true });
    if (withNotifications) await enableNotifications(session, prefs);
    else void api.updateNotificationPrefs(session, prefs).catch(() => undefined);
    setBusy(false);
    resetTo(router, '/home');
  };

  const first = session?.user.firstName ?? 'there';
  const workspace = session ? workspaceLabel(session.workspace) : '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 17, paddingBottom: insets.bottom + 6 }]} bounces={false}>
        <Animated.View entering={ZoomIn.duration(600)} style={[styles.badge, { backgroundColor: colors.okSoft }]}>
          <Icon name="check" size={28} color={colors.accent} strokeWidth={2.6} />
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(500).easing(easeOut)}>
          <Text {...T.title} color={colors.textStrong} style={{ marginTop: 20 }} accessibilityRole="header">
            You're in, {first}.
          </Text>
          <View style={styles.linkedTo}>
            <Text {...T.bodySm} color={colors.muted}>
              This phone is linked to
            </Text>
            {workspace ? (
              <View style={[styles.wsChip, { backgroundColor: colors.raised }]}>
                <Text f="mono400" size={13} lh={18}>
                  {workspace}
                </Text>
              </View>
            ) : null}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500).easing(easeOut)}>
          <Text {...T.label} color={colors.text2} style={{ marginTop: 28, marginBottom: 10 }}>
            What should reach you?
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {rows.map((r, i) => (
              <View key={r.key} style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line2 }]}>
                <IconTile icon={r.icon} tone={r.tone} />
                <View style={{ flex: 1 }}>
                  <Text f="body500" size={15} lh={20}>
                    {r.title}
                  </Text>
                  <Text {...T.caption} lh={16} color={colors.muted} style={{ marginTop: 2 }}>
                    {r.desc}
                  </Text>
                </View>
                <Toggle value={prefs[r.key]} onValueChange={(v) => setPrefs((p) => ({ ...p, [r.key]: v }))} accessibilityLabel={r.title} />
              </View>
            ))}
          </View>
        </Animated.View>

        {bio?.available ? (
          <Animated.View entering={FadeInDown.delay(180).duration(500).easing(easeOut)} style={[styles.card, styles.row, { marginTop: 12, backgroundColor: colors.surface, borderColor: colors.line }]}>
            <IconTile icon="faceId" tone="ok" iconSize={18} strokeWidth={1.8} />
            <View style={{ flex: 1 }}>
              <Text f="body500" size={15} lh={20}>
                {unlockTitle(bio)}
              </Text>
              <Text {...T.caption} lh={16} color={colors.muted} style={{ marginTop: 2 }}>
                Asked each time N-Ops opens
              </Text>
            </View>
            <Toggle value={bioOn} onValueChange={(v) => void toggleBio(v)} accessibilityLabel={unlockTitle(bio)} />
          </Animated.View>
        ) : null}

        <View style={styles.bottom}>
          <PrimaryButton label="Turn on notifications" icon="bell" iconPosition="left" disabled={busy} onPress={() => void finish(true)} />
          <TextButton label="Not now" onPress={() => void finish(false)} />
          <Text {...T.caption} color={colors.muted} align="center">
            Your phone will ask you to confirm. Change these any time in Profile.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 24 },
  badge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  linkedTo: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  wsChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  card: { borderRadius: radius.card, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingHorizontal: 16, paddingVertical: 10 },
  bottom: { marginTop: 'auto', paddingTop: 24, gap: 6 },
});
