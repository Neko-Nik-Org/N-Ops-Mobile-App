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

import { View } from 'react-native';

import { PressableScale } from '@/components/Buttons';
import { Icon, type IconName } from '@/components/Icon';
import { IconTile } from '@/components/Bits';
import { Screen } from '@/components/Page';
import { Text } from '@/components/Text';
import { useRouter } from '@/lib/router';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

type Tone = 'ok' | 'warn' | 'crit' | 'violet';
// shortcut: the API has no tools route yet, so a tool opens Servers (where you pick the target) instead of running.
const TOOLS: Array<{ name: string; desc: string; icon: IconName; tone: Tone; gated?: boolean }> = [
  { name: 'Disk cleanup', desc: 'Clear old logs and caches', icon: 'servers', tone: 'warn' },
  { name: 'Restart service', desc: 'Graceful restart, one server', icon: 'refresh', tone: 'violet', gated: true },
  { name: 'Flush cache', desc: 'Redis keys by pattern', icon: 'database', tone: 'crit' },
  { name: 'Port check', desc: 'Is a port open from here', icon: 'bolt', tone: 'ok' },
  { name: 'SSL check', desc: 'Certificate expiry and chain', icon: 'lock', tone: 'ok' },
  { name: 'Run command', desc: 'One-off shell on a server', icon: 'terminal', tone: 'violet', gated: true },
  { name: 'DNS lookup', desc: 'Resolve from any server', icon: 'lines', tone: 'ok' },
  { name: 'Ping and trace', desc: 'Latency and route hops', icon: 'trend', tone: 'ok' },
];

export default function Tools() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <Screen title="Tools">
      <Text size={14} lh={20} color={colors.muted} style={{ marginTop: 4 }}>
        Pick a tool, then the server to run it on.
      </Text>
      <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {TOOLS.map((t) => (
          <PressableScale key={t.name} accessibilityLabel={`${t.name}${t.gated ? ', needs approval' : ''}`} onPress={() => router.navigate('/servers')} style={{ width: '47.8%', padding: 14, gap: 10, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <IconTile icon={t.icon} tone={t.tone} size={36} iconSize={18} radius={11} />
              {t.gated ? <Icon name="shieldCheck" size={16} color={colors.violetText} /> : null}
            </View>
            <View style={{ gap: 2 }}>
              <Text f="body600" size={15} lh={20} color={colors.textStrong}>
                {t.name}
              </Text>
              <Text size={12} lh={17} color={colors.muted}>
                {t.desc}
              </Text>
            </View>
          </PressableScale>
        ))}
      </View>
    </Screen>
  );
}
