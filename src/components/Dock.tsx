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

import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDashboard } from '@/lib/dashboard';
import { navRef, router } from '@/lib/router';
import { useTheme } from '@/theme/ThemeProvider';
import { PressableScale } from './Buttons';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

const TABS: Array<{ name: string; label: string; icon: IconName }> = [
  { name: 'home', label: 'Home', icon: 'home' },
  { name: 'vault', label: 'Vault', icon: 'vaultBox' },
  { name: 'approvals', label: 'Approvals', icon: 'shieldCheck' },
  { name: 'workflows', label: 'Workflows', icon: 'flow' },
  { name: 'metrics', label: 'Metrics', icon: 'trend' },
];

/** Floating dock with the five most used pages; pages outside it show no tab selected. */
export function Dock() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, approvedIds } = useDashboard();
  const [current, setCurrent] = useState<string | undefined>(() => navRef.getCurrentRoute()?.name);
  useEffect(() => navRef.addListener('state', () => setCurrent(navRef.getCurrentRoute()?.name)), []);
  // iOS reports a 34pt home-indicator inset that leaves the dock floating too high; sit it just above the indicator. Android keeps inset + 12.
  const bottomGap = Platform.OS === 'ios' ? Math.max(insets.bottom - 18, 8) : insets.bottom + 12;
  const waiting = (data?.approvals ?? []).filter((a) => !approvedIds.has(a.id)).length;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: bottomGap }]}>
      <View style={[styles.dock, { backgroundColor: colors.tabbar, borderColor: colors.line, boxShadow: colors.shadow }]}>
        {TABS.map((t) => {
          const on = current === t.name;
          const badge = t.name === 'approvals' && !on ? waiting : 0;
          return (
            <PressableScale
              key={t.name}
              accessibilityRole="button"
              accessibilityLabel={badge ? `${t.label}, ${badge} waiting` : t.label}
              accessibilityState={{ selected: on }}
              onPress={() => router.navigate(`/${t.name}`)}
              style={[styles.tab, on && { backgroundColor: colors.okSoft, paddingHorizontal: 14 }]}
            >
              <Icon name={t.icon} size={22} color={on ? colors.accent : colors.muted} strokeWidth={1.9} />
              {on ? (
                <Text f="body600" size={14} lh={18} color={colors.accent}>
                  {t.label}
                </Text>
              ) : null}
              {badge ? (
                <View style={[styles.badge, { backgroundColor: colors.violet, boxShadow: `0px 0px 0px 2px ${colors.surface}` }]}>
                  <Text f="body700" size={10} lh={16} color="#0B1118" align="center">
                    {badge}
                  </Text>
                </View>
              ) : null}
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  dock: { height: 64, paddingHorizontal: 10, borderRadius: 24, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tab: { height: 44, minWidth: 44, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  badge: { position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8 },
});
