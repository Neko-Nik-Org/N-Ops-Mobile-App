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

import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { IconTile } from './Bits';
import { PrimaryButton, TextButton } from './Buttons';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/** What each permission is for, shown before the system prompt so the ask is never a surprise. */
export const PERMISSION_COPY = {
  camera: {
    icon: 'camera',
    title: 'Allow camera access',
    why: 'To scan the QR code in your admin panel that links this phone to your account.',
    points: ['Used only on the Link this phone screen', 'Nothing is recorded, photographed or uploaded'],
  },
  biometrics: {
    icon: 'faceId',
    title: 'Use Face ID or fingerprint',
    why: 'To unlock N-Ops and to confirm sensitive actions like approving a request or copying a secret.',
    points: ['Your face or fingerprint never leaves this phone', 'You can switch it off any time in Profile'],
  },
} as const satisfies Record<string, { icon: IconName; title: string; why: string; points: readonly string[] }>;

export type PermissionKind = keyof typeof PERMISSION_COPY;

/** Bottom sheet that explains why a permission is needed; "Continue" is where the caller asks the system. */
export function PermissionSheet({
  kind,
  visible,
  onContinue,
  onCancel,
}: {
  kind: PermissionKind;
  visible: boolean;
  onContinue: () => void;
  onCancel: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const c = PERMISSION_COPY[kind];
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onCancel} supportedOrientations={['portrait', 'landscape']}>
      <Pressable style={[styles.scrim, { backgroundColor: colors.sheetScrim }]} onPress={onCancel} accessibilityLabel="Close" />
      <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.line, paddingBottom: insets.bottom + 20 }]}>
        <IconTile icon={c.icon} tone="ok" size={48} iconSize={24} radius={14} />
        <Text f="display600" size={22} lh={28} color={colors.textStrong} accessibilityRole="header">
          {c.title}
        </Text>
        <Text size={15} lh={22} color={colors.text2}>
          Why we ask: {c.why}
        </Text>
        <View style={{ gap: 10 }}>
          {c.points.map((p) => (
            <View key={p} style={styles.point}>
              <Icon name="check" size={16} color={colors.accent} strokeWidth={2.4} />
              <Text size={14} lh={20} color={colors.muted} style={{ flex: 1 }}>
                {p}
              </Text>
            </View>
          ))}
        </View>
        <PrimaryButton label="Continue" onPress={onContinue} />
        <TextButton label="Not now" onPress={onCancel} color={colors.muted} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1 },
  sheet: { paddingHorizontal: 24, paddingTop: 24, gap: 14, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, borderWidth: 1, borderBottomWidth: 0 },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
});
