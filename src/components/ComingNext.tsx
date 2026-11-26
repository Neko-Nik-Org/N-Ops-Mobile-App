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

import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { IconTile } from './Bits';
import type { IconName } from './Icon';
import { Text, type as T } from './Text';

/** Placeholder for tabs whose screens haven't been designed yet. */
export function ComingNext({ icon, body }: { title?: string; icon: IconName; body: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: 12 }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <IconTile icon={icon} tone="violet" size={44} iconSize={22} radius={14} />
        <Text f="body600" size={16} lh={22}>
          Designed next
        </Text>
        <Text {...T.bodySm} color={colors.muted} align="center">
          {body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  card: { marginTop: 22, padding: 24, borderRadius: 20, borderWidth: 1, alignItems: 'center', gap: 10 },
});
