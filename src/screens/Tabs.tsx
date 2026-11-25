import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useCallback } from 'react';

import { TabBar } from '@/components/TabBar';
import { DashboardProvider, useDashboard } from '@/lib/dashboard';
import { Redirect, router } from '@/lib/router';
import { resetAccountPrefs } from '@/lib/prefs';
import { useSession } from '@/lib/session';
import { useTheme } from '@/theme/ThemeProvider';
import Alerts from './tabs/alerts';
import Approvals from './tabs/approvals';
import Home from './tabs/home';
import Profile from './tabs/profile';
import Servers from './tabs/servers';

const Tab = createBottomTabNavigator();

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
  const { data, approvedIds } = useDashboard();
  const waiting = (data?.approvals ?? []).filter((a) => !approvedIds.has(a.id)).length;

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      tabBar={(props) => <TabBar {...props} badges={{ approvals: waiting }} />}
    >
      <Tab.Screen name="home" component={Home} />
      <Tab.Screen name="servers" component={Servers} />
      <Tab.Screen name="approvals" component={Approvals} />
      <Tab.Screen name="alerts" component={Alerts} />
      <Tab.Screen name="profile" component={Profile} />
    </Tab.Navigator>
  );
}
