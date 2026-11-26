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
import { useWindowDimensions } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { ComingNext } from '@/components/ComingNext';
import { DrawerContent } from '@/components/DrawerContent';
import { EXTRA, MENU } from '@/lib/menu';
import { DashboardProvider } from '@/lib/dashboard';
import { Redirect, router } from '@/lib/router';
import { resetAccountPrefs } from '@/lib/prefs';
import { useSession } from '@/lib/session';
import { PERMANENT_W } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import Alerts from './tabs/alerts';
import Approvals from './tabs/approvals';
import Home from './tabs/home';
import Profile from './tabs/profile';
import Servers from './tabs/servers';

const Drawer = createDrawerNavigator();

// Screens that exist; every other menu entry shows the "designed next" placeholder.
const built: Record<string, React.ComponentType> = { home: Home, servers: Servers, approvals: Approvals, alerts: Alerts, profile: Profile };
const items = [...MENU.flatMap((s) => s.children ?? [s]), ...EXTRA];

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
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        header: ({ options }) => <TopBar title={options.title ?? ''} />,
        drawerType: permanent ? 'permanent' : 'front',
        drawerStyle: { width: permanent ? 280 : Math.min(320, width * 0.85), backgroundColor: colors.bg, borderRightColor: colors.line },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {items.map((it) =>
        built[it.name] ? (
          <Drawer.Screen key={it.name} name={it.name} component={built[it.name]} options={{ title: it.title }} />
        ) : (
          <Drawer.Screen key={it.name} name={it.name} options={{ title: it.title }}>
            {() => <ComingNext title={it.title} icon={it.icon ?? 'home'} body={it.body} />}
          </Drawer.Screen>
        ),
      )}
    </Drawer.Navigator>
  );
}
