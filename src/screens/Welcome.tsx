import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import Avatar from './Avatar';

const steps = [
  { eyebrow: 'WELCOME TO', title: 'N-Ops', sub: 'The open-source infrastructure control plane, now in your pocket.', points: ['Open source and self-hostable', 'Built for teams and solo admins'] },
  { eyebrow: 'ALL IN ONE PLACE', title: 'Run it all', sub: 'Keep an eye on everything your team runs, from anywhere.', points: ['Servers and containers', 'Secrets in an encrypted vault', 'Approvals and audit trail'] },
  { eyebrow: 'ONE LAST STEP', title: 'Scan to sign in', sub: 'Link this app to your account by scanning a QR code from N-Ops on the web.', points: ['No password typed on your phone', 'Camera is used only for scanning'] },
];

export default function Welcome({ onNext }: { onNext: () => void }) {
  const { c, isDark, toggle } = useTheme();
  const [i, setI] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const last = i === steps.length - 1;
  const st = steps[i];

  const next = () => {
    if (last) return onNext();
    Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setI(i + 1);
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  return (
    <View style={[s.root, { backgroundColor: c.bg }]}>
      <View style={[s.glow, { backgroundColor: c.violet }]} />
      <View style={s.top}>
        {!last ? <Pressable onPress={onNext} accessibilityRole="button"><Text style={[s.toggleText, { color: c.mute }]}>Skip</Text></Pressable> : <View />}
        <Pressable style={[s.toggle, { borderColor: c.mute }]} onPress={toggle} accessibilityRole="button" accessibilityLabel="Switch theme">
          <Text style={[s.toggleText, { color: c.ink }]}>{isDark ? 'Light' : 'Dark'}</Text>
        </Pressable>
      </View>
      <Avatar step={i} />
      <Animated.View style={{ opacity: fade }}>
        <Text style={[s.eyebrow, { color: c.mute }]}>{st.eyebrow}</Text>
        <Text style={[s.title, { color: c.ink }]}>{st.title}</Text>
        <Text style={[s.sub, { color: c.mute }]}>{st.sub}</Text>
        <View style={s.list}>
          {st.points.map(p => (
            <View key={p} style={s.row}><View style={[s.dot, { backgroundColor: c.mint }]} /><Text style={[s.item, { color: c.ink }]}>{p}</Text></View>
          ))}
        </View>
      </Animated.View>
      <View style={s.dots}>
        {steps.map((_, n) => <View key={n} style={[s.pip, { backgroundColor: n === i ? c.mint : c.mute, opacity: n === i ? 1 : 0.35, width: n === i ? 24 : 8 }]} />)}
      </View>
      <Pressable style={[s.btn, { backgroundColor: c.mint }]} onPress={next} accessibilityRole="button">
        <Text style={[s.btnText, { color: c.onMint }]}>{last ? 'Scan QR code' : 'Next'}</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, padding: 28, justifyContent: 'flex-end', paddingBottom: 48 },
  glow: { position: 'absolute', top: -120, right: -100, width: 320, height: 320, borderRadius: 160, opacity: 0.18 },
  top: { position: 'absolute', top: 56, left: 28, right: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggle: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  toggleText: { fontSize: 13 },
  eyebrow: { letterSpacing: 3, fontSize: 12, marginTop: 12, marginBottom: 4 },
  title: { fontSize: 48, fontWeight: '700', letterSpacing: -2 },
  sub: { fontSize: 17, lineHeight: 24, marginTop: 8 },
  list: { marginTop: 20, gap: 12, minHeight: 90 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  item: { fontSize: 16, flex: 1 },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginVertical: 20 },
  pip: { height: 8, borderRadius: 4 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { fontSize: 17, fontWeight: '700' },
});
