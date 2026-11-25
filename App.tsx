import { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme';
import Splash from './src/screens/Splash';
import Welcome from './src/screens/Welcome';
import ScanQR from './src/screens/ScanQR';

// Three fixed steps, so plain state beats adding a navigation library.
function Root() {
  const { isDark } = useTheme();
  const [step, setStep] = useState<'splash' | 'welcome' | 'scan'>('splash');
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {step === 'splash' && <Splash onDone={() => setStep('welcome')} />}
      {step === 'welcome' && <Welcome onNext={() => setStep('scan')} />}
      {step === 'scan' && <ScanQR />}
    </SafeAreaProvider>
  );
}

export default function App() {
  return <ThemeProvider><Root /></ThemeProvider>;
}
