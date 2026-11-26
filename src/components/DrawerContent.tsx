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
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDashboard } from '@/lib/dashboard';
import { workspaceLabel } from '@/lib/format';
import { EXTRA, MENU, type MenuItem } from '@/lib/menu';
import { useSession } from '@/lib/session';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from './Icon';
import { LogoMark } from './Logo';
import { Text } from './Text';

/** Admin UI sidebar, as a drawer: single links, expandable groups, live Approvals count. */
export function DrawerContent({ state, navigation }: DrawerContentComponentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { data, approvedIds } = useDashboard();
  const waiting = (data?.approvals ?? []).filter((a) => !approvedIds.has(a.id)).length;
  const active = state.routes[state.index]?.name;
  const [open, setOpen] = useState<string | null>(() => MENU.find((s) => s.children?.some((c) => c.name === active))?.name ?? null);

  const go = (name: string) => {
    navigation.navigate(name);
    navigation.closeDrawer();
  };

  const row = (it: MenuItem, child = false) => {
    const on = active === it.name;
    const badge = it.name === 'approvals' && waiting ? waiting : 0;
    return (
      <Pressable
        key={it.name}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        onPress={() => go(it.name)}
        style={[styles.row, child && styles.child, on && { backgroundColor: colors.raised }]}
      >
        {it.icon ? <Icon name={it.icon} size={20} color={on ? colors.accent : colors.muted} strokeWidth={on ? 2 : 1.9} /> : null}
        <Text f={on ? 'body600' : 'body500'} size={15} lh={20} color={on ? colors.textStrong : colors.text2} style={{ flex: 1 }}>
          {it.title}
        </Text>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: colors.violet }]}>
            <Text f="body700" size={11} lh={18} color="#0B1118" align="center">
              {badge}
            </Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 9, paddingBottom: insets.bottom + 6 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Switch workspace" style={styles.brand}>
        <LogoMark size={32} />
        <View style={{ flexShrink: 1 }}>
          <Text size={11} lh={14} color={colors.muted}>
            Workspace
          </Text>
          <View style={styles.wsRow}>
            <Text f="body600" size={15} lh={20} color={colors.textStrong} numberOfLines={1} style={{ flexShrink: 1 }}>
              {session ? workspaceLabel(session.workspace) : '—'}
            </Text>
            <Icon name="chevronDown" size={14} color={colors.muted} strokeWidth={2.2} />
          </View>
        </View>
      </Pressable>
      <ScrollView contentContainerStyle={styles.list}>
        {MENU.map((s) =>
          s.children ? (
            <View key={s.name}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open === s.name }}
                onPress={() => setOpen(open === s.name ? null : s.name)}
                style={styles.row}
              >
                {s.icon ? <Icon name={s.icon} size={20} color={colors.muted} strokeWidth={1.9} /> : null}
                <Text f="body500" size={15} lh={20} color={colors.text2} style={{ flex: 1 }}>
                  {s.title}
                </Text>
                <Icon name={open === s.name ? 'chevronDown' : 'chevronRight'} size={16} color={colors.muted} strokeWidth={2.2} />
              </Pressable>
              {open === s.name ? s.children.map((c) => row(c, true)) : null}
            </View>
          ) : (
            row(s)
          ),
        )}
      </ScrollView>
      <View style={[styles.footer, { borderTopColor: colors.line }]}>{EXTRA.map((e) => row(e))}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  brand: { minHeight: 44, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  list: { padding: 12, gap: 2 },
  row: { height: 44, paddingHorizontal: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  child: { marginLeft: 20, paddingLeft: 20 },
  badge: { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9 },
  footer: { borderTopWidth: 1, padding: 12, gap: 2 },
});
