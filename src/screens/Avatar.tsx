import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../theme';

// Flat illustrated character holding a tablet; each welcome step has its own person, outfit and tablet colours.
// Tablet content: 0 brand, 1 everything-in-one-place, 2 QR scan.
const looks = [
  { skin: '#FFC09F', skinD: '#F9A585', hair: '#2B3A9E', hairH: '#4A5FD8', blazer: '#3B2F8F', lapel: '#2D2478', tee: '#FF7A8A', neck: '#E8566A', frame: '#27358F', screen: '#4F5FE0', smile: '#C8605A', hairStyle: 0, glasses: 'round' },
  { skin: '#B9835C', skinD: '#A06C47', hair: '#3A2418', hairH: '#5C3A28', blazer: '#0E8F6E', lapel: '#0A7358', tee: '#F4F6F8', neck: '#CBD2DA', frame: '#0A5E4B', screen: '#17907A', smile: '#7A3A2E', hairStyle: 1, glasses: null },
  { skin: '#E8B48F', skinD: '#D39A74', hair: '#1F1F26', hairH: '#3A3A48', blazer: '#E8663D', lapel: '#C94E2B', tee: '#2B2F44', neck: '#1B1E30', frame: '#7A2E16', screen: '#F08A5D', smile: '#FFFFFF', hairStyle: 2, glasses: 'square' },
] as const;
const W = 256, H = 264;

const loop = (v: Animated.Value, d: number) =>
  Animated.loop(Animated.sequence([
    Animated.timing(v, { toValue: 1, duration: d, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    Animated.timing(v, { toValue: 0, duration: d, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
  ]));

function Figure({ step }: { step: number }) {
  const { c } = useTheme();
  const L = looks[step];
  const float = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const a = useRef(new Animated.Value(0)).current; // pulse / scan line / wave
  const checks = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const anims = [loop(float, 1600), loop(bob, 1200), loop(a, step === 2 ? 1100 : 700)];
    if (step === 1) {
      const pop = checks.map(v => Animated.spring(v, { toValue: 1, useNativeDriver: true }));
      anims.push(Animated.loop(Animated.sequence([
        Animated.stagger(450, pop), Animated.delay(900),
        Animated.parallel(checks.map(v => Animated.timing(v, { toValue: 0, duration: 200, useNativeDriver: true }))),
      ])));
    }
    anims.forEach(x => x.start());
    return () => anims.forEach(x => x.stop());
  }, [step, float, bob, a, checks]);

  const rng = <T extends number | string>(v: Animated.Value, o: T[]) => v.interpolate({ inputRange: [0, 1], outputRange: o });
  return (
    <Animated.View style={[s.fig, { transform: [{ translateY: rng(float, [0, -5]) }] }]}>
      {/* body */}
      <Svg width={W} height={H} style={s.abs}>
        <Path d="M62 256 L68 170 Q70 152 92 146 L148 146 Q170 152 172 170 L180 256 Z" fill={L.blazer} />
        <Path d="M100 148 L140 148 L146 256 L94 256 Z" fill={L.tee} />
        <Path d="M104 148 Q120 166 136 148" stroke={L.neck} strokeWidth={3} fill="none" />
        <Path d="M92 146 L106 150 L112 204 L82 182 Z" fill={L.lapel} />
        <Path d="M148 146 L134 150 L128 204 L158 182 Z" fill={L.lapel} />
        {L.hairStyle === 1 && <Path d="M84 90 Q78 40 120 40 Q162 40 156 90 L160 136 Q148 128 150 104 L90 104 Q92 128 80 136 Z" fill={L.hair} />}
        {L.hairStyle === 1 && <Circle cx={120} cy={38} r={13} fill={L.hair} />}
        <Rect x={108} y={116} width={24} height={36} rx={9} fill={L.skinD} />
        <Circle cx={86} cy={94} r={8} fill={L.skinD} />
        <Ellipse cx={120} cy={90} rx={34} ry={38} fill={L.skin} />
        {L.hairStyle === 2 && <Path d="M88 98 Q90 132 120 134 Q150 132 152 98 Q146 120 120 120 Q94 120 88 98 Z" fill={L.hair} />}
        {L.hairStyle === 0 && <><Path d="M84 88 Q78 44 120 42 Q164 44 156 86 Q152 64 130 62 Q106 60 94 72 Q86 76 84 88 Z" fill={L.hair} /><Path d="M96 58 Q114 36 142 48 Q120 46 108 62 Z" fill={L.hairH} /></>}
        {L.hairStyle === 1 && <><Path d="M85 86 Q90 50 124 50 Q152 52 155 86 Q140 62 118 66 Q100 68 85 86 Z" fill={L.hair} /><Path d="M100 56 Q118 46 138 56 Q120 52 104 62 Z" fill={L.hairH} /></>}
        {L.hairStyle === 2 && <><Path d="M85 86 Q80 44 120 44 Q160 44 155 86 Q150 60 120 58 Q90 60 85 86 Z" fill={L.hair} /><Path d="M98 52 Q120 42 144 52 Q122 50 104 58 Z" fill={L.hairH} /></>}
        {L.glasses === 'round' && <><Circle cx={106} cy={92} r={13} fill="#fff" fillOpacity={0.35} stroke={L.frame} strokeWidth={3} /><Circle cx={138} cy={92} r={13} fill="#fff" fillOpacity={0.35} stroke={L.frame} strokeWidth={3} /><Path d="M119 90 L125 90 M93 90 L86 86" stroke={L.frame} strokeWidth={3} /></>}
        {L.glasses === 'square' && <><Rect x={93} y={81} width={26} height={22} rx={6} fill="#fff" fillOpacity={0.3} stroke="#1B1E30" strokeWidth={3} /><Rect x={125} y={81} width={26} height={22} rx={6} fill="#fff" fillOpacity={0.3} stroke="#1B1E30" strokeWidth={3} /><Path d="M119 90 L125 90 M93 90 L86 86" stroke="#1B1E30" strokeWidth={3} /></>}
        <Circle cx={109} cy={93} r={4} fill="#3C2A4D" />
        <Circle cx={141} cy={93} r={4} fill="#3C2A4D" />
        <Path d="M96 76 Q106 70 114 76 M130 76 Q140 70 150 76" stroke={L.hair} strokeWidth={3} fill="none" strokeLinecap="round" />
        <Path d="M121 98 Q118 106 123 107" stroke={L.skinD} strokeWidth={3} fill="none" strokeLinecap="round" />
        <Path d="M110 112 Q124 120 138 109" stroke={L.smile} strokeWidth={3} fill="none" strokeLinecap="round" />
      </Svg>

      {/* relaxed arm with an open hand: waves hello on step 0, gently sways otherwise */}
      <Animated.View style={[s.abs, { transformOrigin: '80px 172px', transform: [{ rotate: rng(a, step === 0 ? ['-8deg', '10deg'] : ['0deg', '-4deg']) }] }]}>
        <Svg width={W} height={H}>
          <G y={-14}>
            <Path d="M80 172 Q54 196 66 222 L100 212" stroke={L.blazer} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Path d="M92 216 L100 212" stroke={L.tee} strokeWidth={20} strokeLinecap="round" />
            <Rect x={97} y={186} width={5} height={16} rx={2.5} fill={L.skin} />
            <Rect x={102.5} y={183} width={5} height={19} rx={2.5} fill={L.skin} />
            <Rect x={108} y={184} width={5} height={18} rx={2.5} fill={L.skin} />
            <Rect x={113.5} y={188} width={5} height={14} rx={2.5} fill={L.skin} />
            <Rect x={95} y={196} width={25} height={22} rx={10} fill={L.skin} />
            <G rotation={-35} origin="95, 210"><Rect x={89} y={200} width={7} height={15} rx={3.5} fill={L.skin} /></G>
          </G>
        </Svg>
      </Animated.View>

      {/* raised arm + tablet */}
      <Animated.View style={[s.abs, { transform: [{ translateX: 18 }, { translateY: rng(bob, [0, -4]) }] }]}>
        <Svg width={W} height={H} style={s.abs}>
          <Path d="M142 172 Q198 196 194 140" stroke={L.blazer} strokeWidth={22} strokeLinecap="round" fill="none" />
          <Path d="M194 150 L194 140" stroke={L.tee} strokeWidth={20} strokeLinecap="round" />
          <Rect x={144} y={18} width={84} height={108} rx={10} fill={L.frame} />
          <Rect x={150} y={24} width={72} height={96} rx={6} fill={L.screen} />
        </Svg>
        <View style={s.screen}>
          {step === 0 && (
            <Animated.View style={{ alignItems: 'center', transform: [{ scale: rng(a, [1, 1.12]) }] }}>
              <Text style={s.logo}>N<Text style={{ color: c.mint }}>-</Text>Ops</Text>
              <View style={[s.dot, { backgroundColor: c.mint }]} />
            </Animated.View>
          )}
          {step === 1 && ['Servers', 'Vault', 'Audit'].map((t, n) => (
            <View key={t} style={s.row}>
              <View style={s.ico} /><Text style={s.rowText} numberOfLines={1}>{t}</Text>
              <Animated.View style={[s.tick, { backgroundColor: c.mint, transform: [{ scale: checks[n] }] }]}><Text style={s.tickText}>✓</Text></Animated.View>
            </View>
          ))}
          {step === 2 && (
            <View style={s.qrBox}>
              <View style={s.qr}>{Array.from({ length: 25 }, (_, n) => <View key={n} style={[s.cell, [0, 1, 2, 4, 5, 6, 10, 12, 14, 18, 19, 20, 22, 24].includes(n) && s.cellOn]} />)}</View>
              <Animated.View style={[s.scan, { backgroundColor: c.mint, transform: [{ translateY: rng(a, [0, 56]) }] }]} />
            </View>
          )}
        </View>
        <Svg width={W} height={H} style={s.abs} pointerEvents="none">
          <Circle cx={194} cy={128} r={13} fill={L.skin} />
          <Circle cx={182} cy={118} r={6} fill={L.skin} />
        </Svg>
      </Animated.View>

      {/* fade the cropped waist into the background */}
      <Svg width={W} height={H} style={s.abs} pointerEvents="none">
        <Defs><LinearGradient id="f" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={c.bg} stopOpacity={0} /><Stop offset="1" stopColor={c.bg} stopOpacity={1} /></LinearGradient></Defs>
        <Rect x={0} y={212} width={W} height={52} fill="url(#f)" />
      </Svg>
    </Animated.View>
  );
}

export default function Avatar({ step }: { step: number }) {
  return (
    <View style={s.wrap} accessible accessibilityLabel="Illustration of a person showing the app">
      <Figure key={step} step={step} />
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { height: 230, alignItems: 'center', justifyContent: 'center' },
  fig: { width: W, height: H, transform: [{ scale: 0.86 }] },
  abs: { position: 'absolute', left: 0, top: 0, width: W, height: H },
  screen: { position: 'absolute', left: 150, top: 24, width: 72, height: 96, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 6 },
  logo: { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: -1 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 64, height: 24, marginVertical: 3, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 4 },
  ico: { width: 8, height: 8, borderRadius: 3, backgroundColor: '#fff' },
  rowText: { flex: 1, color: '#fff', fontSize: 7, fontWeight: '600' },
  tick: { width: 12, height: 12, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  tickText: { color: '#0B0F14', fontSize: 8, fontWeight: '800' },
  qrBox: { width: 58, height: 58 },
  qr: { width: 58, height: 58, flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: 2, backgroundColor: '#fff', borderRadius: 4 },
  cell: { width: 9, height: 9 },
  cellOn: { backgroundColor: '#1B1F3B' },
  scan: { position: 'absolute', left: -4, top: 0, width: 66, height: 3, borderRadius: 2 },
});
