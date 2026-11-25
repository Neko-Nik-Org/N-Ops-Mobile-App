import { useRouter } from '@/lib/router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnimatedSplash } from '@/components/AnimatedSplash';
import { PrimaryButton } from '@/components/Buttons';
import { authenticate, getBiometricInfo } from '@/lib/biometrics';
import { loadPrefs } from '@/lib/prefs';
import { useSession } from '@/lib/session';

/**
 * Splash on every cold start, then:
 *   first launch           → Welcome 1–4
 *   seen welcome, unlinked → Scan QR
 *   linked                 → (biometric unlock) → Dashboard, or "Make it yours" if setup was never finished
 */
export default function SplashRoute() {
  const router = useRouter();
  const { status, session } = useSession();
  const [animDone, setAnimDone] = useState(false);
  const [locked, setLocked] = useState(false);

  const unlockAndGo = async () => {
    const prefs = await loadPrefs();
    if (prefs.biometricLock) {
      const bio = await getBiometricInfo();
      if (bio.available && !(await authenticate('Unlock N-Ops'))) {
        setLocked(true);
        return;
      }
    }
    setLocked(false);
    router.replace(prefs.setupDone ? '/home' : '/setup');
  };

  useEffect(() => {
    if (!animDone || status !== 'ready') return;
    void (async () => {
      if (session) return unlockAndGo();
      const prefs = await loadPrefs();
      router.replace(prefs.onboardingSeen ? '/scan' : '/welcome');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animDone, status]);

  return (
    <AnimatedSplash
      onDone={() => setAnimDone(true)}
      footer={
        locked ? (
          <View style={styles.unlock}>
            <PrimaryButton label="Unlock" icon="faceId" iconPosition="left" onPress={() => void unlockAndGo()} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  unlock: { alignSelf: 'stretch', paddingHorizontal: 24, marginBottom: 12 },
});
