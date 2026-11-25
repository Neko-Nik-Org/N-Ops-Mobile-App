import { Haptics } from '@/lib/haptics';
import { useFocusEffect, useRouter } from '@/lib/router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Linking, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, G, Path } from 'react-native-svg';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';

import { usePulse } from '@/components/Bits';
import { PrimaryButton, RoundIconButton, SecondaryButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { BrandGradient, useSvgId } from '@/components/Logo';
import { Text } from '@/components/Text';
import { parseLinkPayload } from '@/lib/linkPayload';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, radius } from '@/theme/tokens';
import { easeInOut } from '@/theme/motion';

type Hint = 'searching' | 'invalid' | 'found';

function roundedRect(x: number, y: number, s: number, r: number) {
  return `M${x + r} ${y}H${x + s - r}A${r} ${r} 0 0 1 ${x + s} ${y + r}V${y + s - r}A${r} ${r} 0 0 1 ${x + s - r} ${y + s}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + s - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}

export default function Scan() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [denied, setDenied] = useState(false);
  const [focused, setFocused] = useState(false);
  const [torch, setTorch] = useState(false);
  const [hint, setHint] = useState<Hint>('searching');
  const handled = useRef(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gid = useSvgId('qb');
  const pulse = usePulse();
  const reduce = useReducedMotion();

  useFocusEffect(
    useCallback(() => {
      handled.current = false;
      setHint('searching');
      setFocused(true);
      return () => {
        setFocused(false);
        setTorch(false);
      };
    }, []),
  );
  useEffect(() => () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
  }, []);

  // Geometry: the canvas frame (390×844) with responsive fallbacks for short screens.
  const compact = H < 740;
  const size = compact ? 220 : 260;
  const cutTop = insets.top + (compact ? 70 : 103);
  const cutLeft = (W - size) / 2;
  const scanTravel = size - 34;

  const y = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    y.value = withRepeat(withSequence(withTiming(scanTravel, { duration: 1300, easing: easeInOut }), withTiming(0, { duration: 1300, easing: easeInOut })), -1);
    return () => cancelAnimation(y);
  }, [reduce, scanTravel, y]);
  const scanLine = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  const onScanned = useCallback(
    (data: string) => {
      if (handled.current) return;
      const payload = parseLinkPayload(data);
      if (!payload) {
        if (hint !== 'invalid') {
          Haptics.warning();
          setHint('invalid');
          if (hintTimer.current) clearTimeout(hintTimer.current);
          hintTimer.current = setTimeout(() => setHint('searching'), 2500);
        }
        return;
      }
      handled.current = true;
      setHint('found');
      Haptics.success();
      router.push({ pathname: '/linking', params: { code: payload.code, server: payload.server ?? '', userId: String(payload.userId) } });
    },
    [hint, router],
  );
  const scanner = useCodeScanner({ codeTypes: ['qr'], onCodeScanned: (codes) => codes[0]?.value && onScanned(codes[0].value) });

  const granted = hasPermission;
  const canAsk = !denied;

  return (
    <View style={[styles.root, { backgroundColor: brand.camera.bg }]}>
      <StatusBar barStyle="light-content" />
      {granted && focused ? (
        device ? <Camera style={StyleSheet.absoluteFill} device={device} isActive torch={torch && device.hasTorch ? 'on' : 'off'} codeScanner={scanner} /> : null
      ) : null}

      {/* Scrim with a rounded hole, then the gradient corner brackets. */}
      <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path d={`M0 0H${W}V${H}H0Z ${roundedRect(cutLeft, cutTop, size, 28)}`} fill={brand.camera.scrim} fillRule="evenodd" />
      </Svg>
      <Svg width={size + 24} height={size + 24} viewBox="0 0 284 284" style={{ position: 'absolute', left: cutLeft - 12, top: cutTop - 12 }} pointerEvents="none">
        <Defs>
          <BrandGradient id={gid} />
        </Defs>
        <G fill="none" stroke={`url(#${gid})`} strokeWidth={5 * (284 / (size + 24))} strokeLinecap="round">
          <Path d="M4 52 V32 A28 28 0 0 1 32 4 H52" />
          <Path d="M232 4 H252 A28 28 0 0 1 280 32 V52" />
          <Path d="M280 232 V252 A28 28 0 0 1 252 280 H232" />
          <Path d="M52 280 H32 A28 28 0 0 1 4 252 V232" />
        </G>
      </Svg>

      {granted ? (
        <View style={{ position: 'absolute', left: cutLeft + 16, top: cutTop + 17, width: size - 32 }} pointerEvents="none">
          <Animated.View style={[styles.scanLine, scanLine]} />
        </View>
      ) : (
        <View style={[styles.permission, { left: cutLeft, top: cutTop, width: size, height: size }]}>
          <Icon name="camera" size={28} color={brand.camera.text} strokeWidth={1.8} />
          <Text f="body600" size={15} lh={20} color={brand.camera.text} align="center">
            Camera access is needed{'\n'}to scan the code
          </Text>
          <View style={{ alignSelf: 'stretch', paddingHorizontal: 20 }}>
            <PrimaryButton
              label={canAsk ? 'Allow camera' : 'Open Settings'}
              onPress={() => (canAsk ? void requestPermission().then((ok) => setDenied(!ok)) : void Linking.openSettings())}
              tone="mint"
              style={{ height: 48 }}
            />
          </View>
        </View>
      )}

      <View style={[styles.topBar, { top: insets.top + 9 }]}>
        <RoundIconButton icon="chevronLeft" accessibilityLabel="Back" background={brand.camera.button} color={brand.camera.text} onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />
        <Text f="display600" size={17} lh={22} color={brand.camera.text} accessibilityRole="header">
          Link this phone
        </Text>
        <RoundIconButton
          icon="flashlight"
          accessibilityLabel="Flashlight"
          selected={torch}
          background={torch ? brand.mint : brand.camera.button}
          color={torch ? brand.onMint : brand.camera.text}
          onPress={() => setTorch((v) => !v)}
        />
      </View>

      <View style={[styles.hint, { top: cutTop + size + 22 }]} accessibilityLiveRegion="polite">
        {hint === 'searching' ? (
          <Animated.View style={[styles.hintRow, pulse]}>
            <View style={[styles.hintDot, { backgroundColor: brand.mint }]} />
            <Text f="mono400" size={12} lh={16} color={brand.mint}>
              Looking for a code…
            </Text>
          </Animated.View>
        ) : (
          <View style={styles.hintRow}>
            <View style={[styles.hintDot, { backgroundColor: hint === 'found' ? brand.mint : '#FFB547' }]} />
            <Text f="mono400" size={12} lh={16} color={hint === 'found' ? brand.mint : '#FFB547'}>
              {hint === 'found' ? 'Code found' : "That QR isn't an N-Ops link code"}
            </Text>
          </View>
        )}
        <Text f="display600" size={20} lh={26} ls={-0.2} color={brand.camera.text} align="center">
          Scan your admin panel QR
        </Text>
      </View>

      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 6 }]}>
        <Text f="body600" size={13} lh={18} ls={0.26} color={colors.muted}>
          Where to find the code
        </Text>
        {compact ? (
          <Text size={14} lh={20} color={colors.text}>
            Open N-Ops on your computer, go to <Text f="body600" size={14} lh={20}>Account → Devices → Link a mobile device</Text>, then point your camera at the QR.
          </Text>
        ) : (
          <View style={{ gap: 14 }}>
            <Step n={1}>Open N-Ops on your computer</Step>
            <Step n={2}>
              Go to{' '}
              <Text f="body600" size={15} lh={20}>
                Account → Devices → Link a mobile device
              </Text>
            </Step>
            <Step n={3}>Point your camera at the QR code</Step>
          </View>
        )}
        <View style={{ marginTop: 4 }}>
          <SecondaryButton label="Can't scan? Type the code" icon="keyboard" onPress={() => router.push('/code')} />
        </View>
      </View>
    </View>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.step}>
      <View style={[styles.stepNum, { backgroundColor: colors.raised }]}>
        <Text f="mono400" size={12} lh={16} color={colors.accent}>
          {n}
        </Text>
      </View>
      <Text size={15} lh={20} style={{ flex: 1 }}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scanLine: {
    height: 2,
    borderRadius: 2,
    backgroundImage: 'linear-gradient(90deg, rgba(76,242,192,0), #4CF2C0 30%, #8A7CFF 70%, rgba(138,124,255,0))',
    boxShadow: '0px 0px 14px 2px rgba(76,242,192,0.55)',
  },
  permission: { position: 'absolute', alignItems: 'center', justifyContent: 'center', gap: 14 },
  topBar: { position: 'absolute', left: 16, right: 16, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hint: { position: 'absolute', left: 24, right: 24, alignItems: 'center', gap: 6 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hintDot: { width: 6, height: 6, borderRadius: 3 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 24,
    paddingHorizontal: 24,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    gap: 18,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
