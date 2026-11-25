import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import { useTheme } from '../theme';

export default function ScanQR() {
  const { c } = useTheme();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [result, setResult] = useState<string | null>(null);
  const asked = useRef(false);

  useEffect(() => {
    if (!hasPermission && !asked.current) { asked.current = true; requestPermission(); }
  }, [hasPermission, requestPermission]);

  const onCodes = useCallback((codes: { value?: string }[]) => {
    const v = codes[0]?.value;
    if (v) setResult(v); // TODO: send to the N-Ops API once the QR-link endpoint exists
  }, []);
  const scanner = useCodeScanner({ codeTypes: ['qr'], onCodeScanned: onCodes });

  if (!hasPermission) {
    return (
      <View style={[s.root, s.center, { backgroundColor: c.bg }]}>
        <Text style={[s.h, { color: c.ink }]}>Camera access needed</Text>
        <Text style={[s.p, { color: c.ink }]}>Allow the camera to scan your N-Ops QR code.</Text>
        <Pressable style={[s.btn, { backgroundColor: c.mint }]} onPress={() => Linking.openSettings()}><Text style={[s.btnText, { color: c.onMint }]}>Open settings</Text></Pressable>
      </View>
    );
  }
  if (!device) return <View style={[s.root, s.center, { backgroundColor: c.bg }]}><Text style={[s.p, { color: c.ink }]}>No camera found on this device.</Text></View>;

  return (
    <View style={s.root}>
      <Camera style={StyleSheet.absoluteFill} device={device} isActive={!result} codeScanner={scanner} />
      <View style={s.overlay} pointerEvents="box-none">
        <Text style={[s.h, s.onCam]}>Scan the QR code</Text>
        <Text style={[s.p, s.onCam]}>Open N-Ops on the web, go to your profile and show the QR code.</Text>
        <View style={[s.frame, { borderColor: c.mint }]} />
        {result && (
          <View style={[s.card, { backgroundColor: c.surface }]}>
            <Text style={[s.p, { color: c.ink }]} numberOfLines={3}>Scanned: {result}</Text>
            <Pressable style={[s.btn, { backgroundColor: c.mint }]} onPress={() => setResult(null)}><Text style={[s.btnText, { color: c.onMint }]}>Scan again</Text></Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1 },
  onCam: { color: '#fff', textShadowColor: '#000', textShadowRadius: 6 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: 28, paddingTop: 72, paddingBottom: 48 },
  h: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  p: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  frame: { position: 'absolute', top: '45%', width: 240, height: 240, borderRadius: 24, borderWidth: 3 },
  card: { borderRadius: 16, padding: 18, gap: 12, alignSelf: 'stretch' },
  btn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700' },
});
