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

import { useState } from 'react';
import { View } from 'react-native';

import { StatusDot } from '@/components/Bits';
import { Empty, GroupTitle, HeadButton, ListCard, ListRow, Screen } from '@/components/Page';
import { Text } from '@/components/Text';
import { useDashboard } from '@/lib/dashboard';
import { useRouter } from '@/lib/router';
import type { Server, ServerStatus } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';

const ORDER: Record<ServerStatus, number> = { offline: 0, degraded: 1, online: 2 };

export function statusTone(s: ServerStatus) {
  return s === 'online' ? 'ok' : s === 'degraded' ? 'warn' : 'crit';
}

export default function Servers() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, loading, refreshing, refresh, error } = useDashboard();
  const [byName, setByName] = useState(false);

  const servers = [...(data?.servers ?? [])].sort((a, b) => (byName ? a.name.localeCompare(b.name) : ORDER[a.status] - ORDER[b.status] || a.name.localeCompare(b.name)));
  const groups = [
    { title: 'Needs attention', rows: servers.filter((s) => s.status !== 'online'), border: colors.warnLine },
    { title: 'Online', rows: servers.filter((s) => s.status === 'online'), border: colors.line },
  ].filter((g) => g.rows.length);

  return (
    <Screen title="Servers" action={<HeadButton label={byName ? 'Name' : 'Status'} icon="sort" onPress={() => setByName((v) => !v)} />} loading={loading} error={error} onRefresh={() => void refresh()} refreshing={refreshing}>
      {groups.length ? (
        groups.map((g) => (
          <View key={g.title}>
            <GroupTitle title={g.title} count={g.rows.length} />
            <ListCard border={g.border}>
              {g.rows.map((s, i) => (
                <Row key={s.id} s={s} first={i === 0} onPress={() => router.navigate({ pathname: '/server', params: { id: s.id } })} />
              ))}
            </ListCard>
          </View>
        ))
      ) : (
        <Empty icon="servers" title="No servers yet" body="Servers reported by your workspace will show here." />
      )}
    </Screen>
  );
}

function Row({ s, first, onPress }: { s: Server; first: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const tone = statusTone(s.status);
  const load = s.cpuPercent;
  const color = tone === 'ok' ? colors.ok : tone === 'warn' ? colors.warn : colors.crit;
  return (
    <ListRow first={first} label={`${s.name}, ${s.status}`} onPress={onPress} chevron>
      <StatusDot tone={tone} shape={tone === 'ok' ? 'circle' : tone === 'warn' ? 'square' : 'diamond'} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text f="mono500" size={14} lh={18} color={colors.textStrong} numberOfLines={1}>
          {s.name}
        </Text>
        <Text size={12} lh={16} color={colors.muted} numberOfLines={1}>
          {[s.kind, s.tagName].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 5 }}>
        <Text f="mono500" size={12} lh={16} color={tone === 'ok' ? colors.text2 : tone === 'warn' ? colors.warnText : colors.critText}>
          {s.status === 'offline' ? 'offline' : load === null ? '—' : `${Math.round(load)}% CPU`}
        </Text>
        <View style={{ width: 48, height: 4, borderRadius: 2, backgroundColor: colors.line, overflow: 'hidden' }}>
          <View style={{ width: `${s.status === 'offline' ? 0 : Math.min(100, load ?? 0)}%`, height: 4, borderRadius: 2, backgroundColor: color }} />
        </View>
      </View>
    </ListRow>
  );
}
