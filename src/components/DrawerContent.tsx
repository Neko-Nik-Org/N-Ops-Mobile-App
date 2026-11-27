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

import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDashboard } from '@/lib/dashboard';
import { hasPin } from '@/lib/pin';
import { router } from '@/lib/router';
import { MENU, type MenuItem } from '@/lib/menu';
import { useSession } from '@/lib/session';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from './Icon';
import { LogoMark } from './Logo';
import { Text } from './Text';

/** Side menu from the design: grouped pages with live counts, profile at the bottom. */
export function DrawerContent({ state, navigation }: DrawerContentComponentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { data, approvedIds } = useDashboard();
  const active = state.routes[state.index]?.name;
  const waiting = (data?.approvals ?? []).filter((a) => !approvedIds.has(a.id)).length;
  // Only what the API reports: server total and waiting approvals.
  const count = (name: string) => (name === 'servers' && data?.fleet.total ? String(data.fleet.total) : '');
  const badge = (name: string) => (name === 'approvals' && waiting ? waiting : 0);

  const go = (name: string) => {
    navigation.navigate(name);
    navigation.closeDrawer();
  };

  // Same lock the auto-lock uses: opens over this screen and unlocking returns here.
  const lockNow = async () => {
    if (!(await hasPin())) return;
    navigation.closeDrawer();
    router.push({ pathname: '/lock', params: { resume: '1' } });
  };

  const row = (it: MenuItem) => {
    const on = active === it.name || (it.name === 'servers' && active === 'server');
    const n = badge(it.name);
    const c = count(it.name);
    return (
      <Pressable key={it.name} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => go(it.name)} style={[styles.row, on && { backgroundColor: colors.okSoft }]}>
        <Icon name={it.icon} size={20} color={on ? colors.accent : colors.muted} strokeWidth={1.9} />
        <Text f={on ? 'body600' : 'body500'} size={15} lh={20} color={on ? colors.accent : colors.text} style={{ flex: 1 }}>
          {it.title}
        </Text>
        {c ? (
          <Text f="mono500" size={12} lh={16} color={colors.muted}>
            {c}
          </Text>
        ) : null}
        {n ? (
          <View style={[styles.badge, { backgroundColor: colors.violet }]}>
            <Text f="body700" size={11} lh={18} color="#0B1118" align="center">
              {n}
            </Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 9, paddingBottom: insets.bottom + 6 }}>
      <View style={styles.brand}>
        <LogoMark size={32} />
        <Text f="display600" size={20} lh={26} color={colors.textStrong}>
          N-Ops
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {MENU.map((g, i) => (
          <View key={g.title ?? i} style={{ gap: 2 }}>
            {g.title ? (
              <Text f="body600" size={11} lh={14} ls={0.9} color={colors.muted} style={styles.groupTitle}>
                {g.title.toUpperCase()}
              </Text>
            ) : null}
            {g.items.map(row)}
          </View>
        ))}
      </ScrollView>
      <Pressable accessibilityRole="button" accessibilityLabel="Profile and settings" onPress={() => go('profile')} style={[styles.footer, { borderTopColor: colors.line }]}>
        <View style={[styles.avatar, { backgroundColor: colors.raised }]}>
          <Text f="display700" size={13} lh={16} color={colors.text2}>
            {session?.user.initials ?? '?'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text f="body600" size={15} lh={20} color={colors.textStrong} numberOfLines={1}>
            {session?.user.displayName ?? ''}
          </Text>
          <Text size={12} lh={16} color={colors.muted}>
            Profile and settings
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lock app"
          hitSlop={6}
          onPress={() => void lockNow()}
          style={[styles.lockBtn, { borderColor: colors.line, backgroundColor: colors.surface }]}
        >
          <Icon name="lock" size={18} color={colors.text2} strokeWidth={1.9} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { minHeight: 44, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  list: { padding: 12, gap: 14 },
  groupTitle: { marginLeft: 12, marginBottom: 2 },
  row: { height: 44, paddingHorizontal: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9 },
  footer: { borderTopWidth: 1, marginHorizontal: 12, paddingHorizontal: 8, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
