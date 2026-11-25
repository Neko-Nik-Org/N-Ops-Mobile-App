import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { IconTile } from './Bits';
import type { IconName } from './Icon';
import { Text, type as T } from './Text';

/** Placeholder for tabs whose screens haven't been designed yet. */
export function ComingNext({ title, icon, body }: { title: string; icon: IconName; body: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top + 9 }]}>
      <Text {...T.titleXs} color={colors.textStrong} accessibilityRole="header">
        {title}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <IconTile icon={icon} tone="violet" size={44} iconSize={22} radius={14} />
        <Text f="body600" size={16} lh={22}>
          Designed next
        </Text>
        <Text {...T.bodySm} color={colors.muted} align="center">
          {body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  card: { marginTop: 22, padding: 24, borderRadius: 20, borderWidth: 1, alignItems: 'center', gap: 10 },
});
