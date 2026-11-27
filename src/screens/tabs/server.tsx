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
import { Empty, Screen } from '@/components/Page';
import { Text } from '@/components/Text';
import { useDashboard } from '@/lib/dashboard';
import { useLocalSearchParams, useRouter } from '@/lib/router';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

export default function Server() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, loading } = useDashboard();
  const s = data?.servers.find((x) => x.id === id);

  return (
    <Screen title={s?.name ?? 'Server'} loading={loading}>
      <PressableScale accessibilityLabel="Back to servers" onPress={() => router.navigate('/servers')} style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }}>
        <Icon name="chevronLeft" size={16} color={colors.accent} strokeWidth={2.2} />
        <Text f="body600" size={14} lh={20} color={colors.accent}>
          Servers
        </Text>
      </PressableScale>
      {s ? (
        <>
          <Text size={14} lh={20} color={colors.muted} style={{ marginTop: 6 }}>
            {[s.kind, s.tagName].filter(Boolean).join(' · ')}
          </Text>
          {s.status !== 'online' ? (
            <View style={{ marginTop: 16, padding: 14, borderRadius: radius.card, borderWidth: 1, borderColor: s.status === 'offline' ? colors.critSoft : colors.warnLine, backgroundColor: s.status === 'offline' ? colors.critSoft : colors.warnSoft }}>
              <Text f="body600" size={15} lh={20} color={s.status === 'offline' ? colors.critText : colors.warnText}>
                {s.status === 'offline' ? 'Offline' : 'Running hot'}
              </Text>
              <Text size={13} lh={19} color={colors.text2}>
                {s.status === 'offline' ? (s.offlineMinutes ? `Not reporting for ${s.offlineMinutes} min.` : 'Not reporting.') : 'CPU or memory is at 90% or more.'}
              </Text>
            </View>
          ) : null}
          <View style={{ marginTop: 16, flexDirection: 'row', gap: 12 }}>
            <Gauge label="CPU" value={s.cpuPercent} />
            <Gauge label="Memory" value={s.memoryPercent} />
          </View>
          <View style={{ marginTop: 16, flexDirection: 'row', gap: 10 }}>
            <Action icon="lines" label="Logs" onPress={() => router.navigate('/logs')} />
            <Action icon="wrench" label="Tools" onPress={() => router.navigate('/tools')} />
          </View>
        </>
      ) : (
        <Empty icon="servers" title="Server not found" body="It may have been removed, or the tag filter hides it." />
      )}
    </Screen>
  );
}

function Gauge({ label, value }: { label: string; value: number | null }) {
  const { colors } = useTheme();
  const hot = (value ?? 0) >= 90;
  return (
    <View style={{ flex: 1, padding: 16, gap: 10, borderRadius: radius.card, borderWidth: 1, borderColor: hot ? colors.warnLine : colors.line, backgroundColor: colors.surface }}>
      <Text size={13} lh={18} color={colors.muted}>
        {label}
      </Text>
      <Text f="display600" size={26} lh={30} color={hot ? colors.warnText : colors.textStrong}>
        {value === null ? '—' : `${Math.round(value)}%`}
      </Text>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.line, overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(100, value ?? 0)}%`, height: 4, backgroundColor: hot ? colors.warn : colors.accent }} />
      </View>
    </View>
  );
}

function Action({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale accessibilityLabel={label} onPress={onPress} style={{ flex: 1, height: 64, gap: 6, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={20} color={colors.accent} strokeWidth={1.9} />
      <Text f="body500" size={13} lh={16}>
        {label}
      </Text>
    </PressableScale>
  );
}
