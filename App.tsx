import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { navRef } from '@/lib/router';
import { SessionProvider } from '@/lib/session';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import Code from './src/screens/code';
import Index from './src/screens';
import Link from './src/screens/link';
import Linking from './src/screens/linking';
import Scan from './src/screens/scan';
import Setup from './src/screens/setup';
import Tabs from './src/screens/Tabs';
import Welcome from './src/screens/welcome';

const Stack = createNativeStackNavigator();

// nops://link?server=…&code=… opens the "link" screen, which forwards to linking.
const linking = { prefixes: ['nops://'], config: { screens: { link: 'link' } } };

function Root() {
  const { ready, colors, scheme } = useTheme();
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <NavigationContainer ref={navRef} linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="index" component={Index} options={{ animation: 'none' }} />
          <Stack.Screen name="welcome" component={Welcome} />
          <Stack.Screen name="scan" component={Scan} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="code" component={Code} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="linking" component={Linking} options={{ gestureEnabled: false }} />
          <Stack.Screen name="setup" component={Setup} options={{ gestureEnabled: false }} />
          <Stack.Screen name="tabs" component={Tabs} options={{ gestureEnabled: false }} />
          <Stack.Screen name="link" component={Link} options={{ animation: 'none' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SessionProvider>
          <Root />
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
