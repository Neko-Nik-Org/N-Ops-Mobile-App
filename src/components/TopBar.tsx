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
import { useSession } from '@/lib/session';
import { useTheme } from '@/theme/ThemeProvider';
import { PressableScale } from './Buttons';
import { Icon } from './Icon';
import { MenuButton } from './MenuButton';
import { TagSelect } from './TagSelect';
import { Text } from './Text';

/** Top bar of every page: menu, inbox, profile avatar. The page title sits below it. */
export function TopBar() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data } = useDashboard();
  const { session } = useSession();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 9, backgroundColor: colors.bg }]}>
      <MenuButton />
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <TagSelect />
      </View>
      <PressableScale
        accessibilityLabel={data?.unreadCount ? `Inbox, ${data.unreadCount} new` : 'Inbox'}
        onPress={() => router.navigate('/alerts')}
        style={styles.icon}
      >
        <Icon name="bell" size={21} color={colors.text} strokeWidth={1.9} />
        {data?.unreadCount ? <View style={[styles.unread, { backgroundColor: colors.crit, boxShadow: `0px 0px 0px 2px ${colors.bg}` }]} /> : null}
      </PressableScale>
      <PressableScale accessibilityLabel="Profile" onPress={() => router.navigate('/profile')} style={[styles.avatar, { backgroundColor: colors.raised }]}>
        <Text f="display700" size={12} lh={16} color={colors.text2}>
          {session?.user.initials ?? '?'}
        </Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: 20, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  unread: { position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
