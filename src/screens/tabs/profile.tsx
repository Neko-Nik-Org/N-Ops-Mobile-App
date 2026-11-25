import { useRouter } from '@/lib/router';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconTile } from '@/components/Bits';
import { PressableScale } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { Text, type as T } from '@/components/Text';
import { Toggle } from '@/components/Toggle';
import { api } from '@/lib/api';
import { authenticate, getBiometricInfo, unlockTitle, type BiometricInfo } from '@/lib/biometrics';
import { hostOf, workspaceLabel } from '@/lib/format';
import { resetTo } from '@/lib/nav';
import { loadPrefs, resetAccountPrefs, savePrefs } from '@/lib/prefs';
import { useSession } from '@/lib/session';
import { useTheme } from '@/theme/ThemeProvider';
import type { ThemePref } from '@/theme/tokens';
import { radius } from '@/theme/tokens';

/**
 * Profile is not on the canvas yet. This scaffold holds the settings the design refers to:
 * Appearance (System / Light / Dark), the biometric lock, notifications, and Unlink.
 */
export default function Profile() {
  const router = useRouter();
  const { colors, pref, setPref } = useTheme();
  const insets = useSafeAreaInsets();
  const { session, clear } = useSession();
  const [bio, setBio] = useState<BiometricInfo | null>(null);
  const [bioOn, setBioOn] = useState(false);

  useEffect(() => {
    void getBiometricInfo().then(setBio);
    void loadPrefs().then((p) => setBioOn(p.biometricLock));
  }, []);

  const toggleBio = async (next: boolean) => {
    if (!(await authenticate(next ? `Use ${bio?.label ?? 'biometrics'} for N-Ops` : 'Turn off the lock'))) return;
    setBioOn(next);
    await savePrefs({ biometricLock: next });
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
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 9 }]}>
      <Text {...T.titleXs} color={colors.textStrong} accessibilityRole="header">
        Profile
      </Text>

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
        <PressableScale accessibilityLabel="Notification settings" onPress={() => void Linking.openSettings()} style={[styles.row, bio?.available && { borderTopWidth: 1, borderTopColor: colors.line2 }]}>
          <IconTile icon="bell" tone="violet" />
          <Text f="body500" size={15} lh={20} style={{ flex: 1 }}>
            Notification settings
          </Text>
          <Icon name="chevronRight" size={18} color={colors.muted} />
        </PressableScale>
      </View>

      <PressableScale accessibilityLabel="Unlink this phone" onPress={unlink} style={[styles.card, styles.row, { marginTop: 24, backgroundColor: colors.surface, borderColor: colors.line }]}>
        <IconTile icon="unlink" tone="crit" />
        <Text f="body600" size={15} lh={20} color={colors.critText} style={{ flex: 1 }}>
          Unlink this phone
        </Text>
      </PressableScale>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  card: { borderRadius: radius.card, borderWidth: 1, overflow: 'hidden' },
  person: { marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: 24, marginBottom: 10 },
  segment: { flexDirection: 'row', padding: 4, borderRadius: radius.sm + 2, gap: 4 },
  segItem: { flex: 1, height: 40, borderRadius: radius.code, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 60, paddingHorizontal: 16, paddingVertical: 10 },
});
