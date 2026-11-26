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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDashboard } from '@/lib/dashboard';
import { router } from '@/lib/router';
import { useTheme } from '@/theme/ThemeProvider';
import { PressableScale } from './Buttons';
import { Icon } from './Icon';
import { MenuButton } from './MenuButton';
import { TagSelect } from './TagSelect';
import { Text } from './Text';

/** Top bar of every drawer screen, like the Admin UI's: menu, page title, tag scope. */
export function TopBar({ title }: { title: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data } = useDashboard();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 9, backgroundColor: colors.bg }]}>
      <MenuButton />
      <Text f="display600" size={18} lh={24} color={colors.textStrong} numberOfLines={1} accessibilityRole="header" style={{ flex: 1 }}>
        {title}
      </Text>
      <View style={{ flexShrink: 1 }}>
        <TagSelect />
      </View>
      <PressableScale
        accessibilityLabel={data?.unreadCount ? `Notifications, ${data.unreadCount} unread` : 'Notifications'}
        onPress={() => router.navigate('/alerts')}
        style={[styles.bell, { backgroundColor: colors.surface }]}
      >
        <Icon name="bell" size={20} color={colors.text} strokeWidth={1.9} />
        {data?.unreadCount ? <View style={[styles.unread, { backgroundColor: colors.crit, boxShadow: `0px 0px 0px 2px ${colors.surface}` }]} /> : null}
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: 20, paddingBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bell: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  unread: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4 },
});
