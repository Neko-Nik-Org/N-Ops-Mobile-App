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

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, View } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAutoLock } from '@/lib/autoLock';
import { PrivacyCover } from '@/components/PrivacyCover';
import { navRef } from '@/lib/router';
import { SessionProvider } from '@/lib/session';
import { MAX_W, useColumn } from '@/theme/layout';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import Code from './src/screens/code';
import Index from './src/screens';
import Link from './src/screens/link';
import Linking from './src/screens/linking';
import Lock from './src/screens/lock';
import PinCreate from './src/screens/pin-create';
import Scan from './src/screens/scan';
import Setup from './src/screens/setup';
import Tabs from './src/screens/Tabs';
import Welcome from './src/screens/welcome';

const Stack = createNativeStackNavigator();

// nops://link?server=…&code=… opens the "link" screen, which forwards to linking.
const linking = { prefixes: ['nops://'], config: { screens: { link: 'link' } } };

function Root() {
  const { ready, colors, scheme } = useTheme();
  const { landscape, left, right } = useColumn();
  useAutoLock();
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={{ flex: 1, width: '100%', maxWidth: landscape ? undefined : MAX_W, alignSelf: 'center', paddingLeft: landscape ? left : 0, paddingRight: landscape ? right : 0 }}>
      <NavigationContainer ref={navRef} linking={linking} onReady={() => void BootSplash.hide({ fade: true })}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="index" component={Index} options={{ animation: 'none' }} />
          <Stack.Screen name="welcome" component={Welcome} />
          <Stack.Screen name="scan" component={Scan} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="code" component={Code} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="linking" component={Linking} options={{ gestureEnabled: false }} />
          <Stack.Screen name="lock" component={Lock} options={{ gestureEnabled: false }} />
          <Stack.Screen name="pin-create" component={PinCreate} options={{ gestureEnabled: false }} />
          <Stack.Screen name="setup" component={Setup} options={{ gestureEnabled: false }} />
          <Stack.Screen name="tabs" component={Tabs} options={{ gestureEnabled: false }} />
          <Stack.Screen name="link" component={Link} options={{ animation: 'none' }} />
        </Stack.Navigator>
      </NavigationContainer>
      </View>
      <PrivacyCover />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SessionProvider>
            <Root />
          </SessionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
