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

import { createDrawerNavigator } from '@react-navigation/drawer';
import { useCallback } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { DrawerContent } from '@/components/DrawerContent';
import { HIDDEN, MENU } from '@/lib/menu';
import { DashboardProvider } from '@/lib/dashboard';
import { Redirect, router } from '@/lib/router';
import { resetAccountPrefs } from '@/lib/prefs';
import { useSession } from '@/lib/session';
import { PERMANENT_W } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import Alerts from './tabs/alerts';
import Approvals from './tabs/approvals';
import Home from './tabs/home';
import Logs from './tabs/logs';
import Metrics from './tabs/metrics';
import Profile from './tabs/profile';
import Server from './tabs/server';
import Servers from './tabs/servers';
import Services from './tabs/services';
import Tools from './tabs/tools';
import Vault from './tabs/vault';
import Workflows from './tabs/workflows';

const Drawer = createDrawerNavigator();

const built: Record<string, React.ComponentType> = {
  home: Home, servers: Servers, server: Server, services: Services, metrics: Metrics, logs: Logs, workflows: Workflows,
  tools: Tools, approvals: Approvals, vault: Vault, alerts: Alerts, profile: Profile,
};
const items = [...MENU.flatMap((g) => g.items), ...HIDDEN];

export default function Tabs() {
  const { session, status, clear } = useSession();

  const onUnlinked = useCallback(() => {
    void (async () => {
      await clear();
      await resetAccountPrefs();
      router.resetTo('/scan');
    })();
  }, [clear]);

  if (status === 'ready' && !session) return <Redirect href="/scan" />;

  return (
    <DashboardProvider onUnlinked={onUnlinked}>
      <TabsInner />
    </DashboardProvider>
  );
}

function TabsInner() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const permanent = width >= PERMANENT_W;

  return (
    <View style={{ flex: 1 }}>
      <Drawer.Navigator
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={{
          headerShown: true,
          header: () => <TopBar />,
          drawerType: permanent ? 'permanent' : 'front',
          drawerStyle: { width: permanent ? 280 : Math.min(320, width * 0.85), backgroundColor: colors.bg, borderRightColor: colors.line },
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        {items.map((it) => (
          <Drawer.Screen key={it.name} name={it.name} component={built[it.name]} options={{ title: it.title }} />
        ))}
      </Drawer.Navigator>
    </View>
  );
}
