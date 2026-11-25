import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

export default function Splash({ onDone }: { onDone: () => void }) {
  const { c } = useTheme();
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [a, onDone]);
  return (
    <View style={[s.root, { backgroundColor: c.bg }]}>
      <Animated.View style={{ opacity: a, transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }}>
        <Text style={[s.logo, { color: c.ink }]}>N<Text style={{ color: c.mint }}>-</Text>Ops</Text>
      </Animated.View>
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 56, fontWeight: '700', letterSpacing: -2 },
});
