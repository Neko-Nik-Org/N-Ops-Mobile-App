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
import Svg, { Polyline } from 'react-native-svg';

import { Empty, Screen } from '@/components/Page';
import { Text } from '@/components/Text';
import { useDashboard } from '@/lib/dashboard';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

// shortcut: no metrics-history route exists, so these are today's fleet readings and the 24h workflow run trend from /dashboard/overview. Add the 15m/1h/24h/7d range once a history route exists.
export default function Metrics() {
  const { data, loading, refreshing, refresh, error } = useDashboard();
  const online = (data?.servers ?? []).filter((s) => s.status !== 'offline');
  const avg = (pick: (s: (typeof online)[number]) => number | null) => {
    const v = online.map(pick).filter((n): n is number => n !== null);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
  };
  const cpu = avg((s) => s.cpuPercent);
  const mem = avg((s) => s.memoryPercent);

  return (
    <Screen title="Metrics" loading={loading} error={error} onRefresh={() => void refresh()} refreshing={refreshing}>
      {data && (cpu !== null || mem !== null || data.workflowRuns24h) ? (
        <View style={{ marginTop: 20, gap: 12 }}>
          <Tile label="Workflow runs, 24h" value={String(data.workflowRuns24h)} note={data.workflowRunsFailed ? `${data.workflowRunsFailed} failed` : 'none failed'} bad={!!data.workflowRunsFailed} points={data.workflowRunTrend} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Tile label="CPU, all servers" value={cpu === null ? '—' : `${cpu}%`} note={`${online.length} reporting`} />
            <Tile label="Memory" value={mem === null ? '—' : `${mem}%`} note={`${online.length} reporting`} />
          </View>
        </View>
      ) : (
        <Empty icon="trend" title="No metrics yet" body="Requests, errors, latency, CPU and memory will chart here once servers report in." />
      )}
    </Screen>
  );
}

function Tile({ label, value, note, bad, points }: { label: string; value: string; note: string; bad?: boolean; points?: number[] }) {
  const { colors } = useTheme();
  const max = Math.max(...(points ?? [0]), 1);
  const line = (points ?? []).map((p, i, a) => `${(i / Math.max(a.length - 1, 1)) * 140},${26 - (p / max) * 22}`).join(' ');
  return (
    <View style={{ flex: 1, padding: 16, gap: 8, borderRadius: radius.card, borderWidth: 1, borderColor: bad ? colors.critSoft : colors.line, backgroundColor: colors.surface }}>
      <Text size={13} lh={18} color={colors.muted}>
        {label}
      </Text>
      <Text f="display600" size={26} lh={30} color={bad ? colors.critText : colors.textStrong}>
        {value}
      </Text>
      {line && (points?.length ?? 0) > 1 ? (
        <Svg width="100%" height={30} viewBox="0 0 140 30" preserveAspectRatio="none">
          <Polyline points={line} fill="none" stroke={bad ? colors.crit : colors.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ) : null}
      <Text size={12} lh={16} color={bad ? colors.critText : colors.muted}>
        {note}
      </Text>
    </View>
  );
}
