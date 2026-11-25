import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

const meta: Record<string, { label: string; icon: IconName }> = {
  home: { label: 'Home', icon: 'home' },
  servers: { label: 'Servers', icon: 'servers' },
  approvals: { label: 'Approvals', icon: 'shieldCheck' },
  alerts: { label: 'Alerts', icon: 'bell' },
  profile: { label: 'Profile', icon: 'user' },
};

/** 5-tab bar from the dashboard design (58 px + home indicator). */
export function TabBar({ state, navigation, badges }: BottomTabBarProps & { badges: Partial<Record<string, number>> }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) - 8, backgroundColor: colors.tabbar, borderTopColor: colors.line }]}
    >
      {state.routes.map((route, i) => {
        const m = meta[route.name];
        if (!m) return null;
        const focused = state.index === i;
        const color = focused ? colors.accent : colors.muted;
        const badge = badges[route.name];
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={badge ? `${m.label}, ${badge} waiting` : m.label}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }}
            style={styles.tab}
          >
            <Icon name={m.icon} size={22} color={color} strokeWidth={focused ? 2 : 1.9} />
            <Text f={focused ? 'body600' : 'body500'} size={11} lh={14} color={color}>
              {m.label}
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
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', paddingTop: 8, paddingHorizontal: 8, borderTopWidth: 1 },
  tab: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', gap: 4 },
  badge: { position: 'absolute', top: 0, left: '50%', marginLeft: 6, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9 },
});
