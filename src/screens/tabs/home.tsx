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
import Svg, { Circle } from 'react-native-svg';

import { IconTile } from '@/components/Bits';
import { PressableScale, SmallButton } from '@/components/Buttons';
import { Icon, type IconName } from '@/components/Icon';
import { Screen } from '@/components/Page';
import { Text } from '@/components/Text';
import { useDashboard } from '@/lib/dashboard';
import { greeting } from '@/lib/format';
import { useRouter } from '@/lib/router';
import { useSession } from '@/lib/session';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();
  const { session } = useSession();
  const { data, loading, refreshing, refresh, approvedIds, decide, error } = useDashboard();
  const pending = (data?.approvals ?? []).filter((a) => !approvedIds.has(a.id));
  const first = session?.user.firstName;

  return (
    <Screen title={`${greeting()}${first ? `, ${first}` : ''}`} loading={loading || !data} error={error} onRefresh={() => void refresh()} refreshing={refreshing}>
      {data ? (
        <>
          <Text size={15} lh={22} color={colors.muted} style={{ marginTop: 4 }}>
            {pending.length ? `${pending.length} ${pending.length === 1 ? 'thing needs' : 'things need'} you. Everything else is calm.` : 'All quiet. Nothing needs you right now.'}
          </Text>

          <Fleet fleet={data.fleet} onPress={() => router.navigate('/servers')} />

          {pending.length ? (
            <>
              <View style={{ marginTop: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text f="display600" size={18} lh={24} color={colors.textStrong}>
                    Needs you
                  </Text>
                  <View style={{ paddingHorizontal: 7, borderRadius: 999, backgroundColor: colors.violet }}>
                    <Text f="body700" size={12} lh={20} color="#0B1118">
                      {pending.length}
                    </Text>
                  </View>
                </View>
                <PressableScale accessibilityLabel="See all approvals" onPress={() => router.navigate('/approvals')}>
                  <Text f="body600" size={14} lh={20} color={colors.accent}>
                    See all
                  </Text>
                </PressableScale>
              </View>
              <View style={{ marginTop: 12, padding: 16, gap: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.violetLine, backgroundColor: colors.surface }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <IconTile icon="refresh" tone="violet" size={40} iconSize={20} radius={12} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text f="body600" size={16} lh={22} color={colors.textStrong}>
                      {pending[0].action}
                    </Text>
                    <Text size={13} lh={18} color={colors.muted}>
                      {pending[0].target} · {pending[0].expiresLabel}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <SmallButton label="Review" variant="outline" onPress={() => router.navigate('/approvals')} />
                  <SmallButton label="Approve" variant="primary" onPress={() => void decide(pending[0].id, pending[0].action, true)} />
                </View>
              </View>
            </>
          ) : null}

          <Text f="display600" size={18} lh={24} color={colors.textStrong} style={{ marginTop: 26, marginBottom: 12 }}>
            At a glance
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Tile icon="flow" tone="ok" where="Workflows" value={`${data.workflowRuns24h} runs`} note={data.workflowRunsFailed ? `${data.workflowRunsFailed} failed` : 'in the last 24h'} bad={!!data.workflowRunsFailed} onPress={() => router.navigate('/workflows')} />
            <Tile icon="bell" tone="warn" where="Alerts" value={`${data.alertsSent24h} sent`} note={data.alertsLatestSource || 'in the last 24h'} onPress={() => router.navigate('/alerts')} />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function Fleet({ fleet, onPress }: { fleet: { total: number; online: number; degraded: number; offline: number }; onPress: () => void }) {
  const { colors } = useTheme();
  const R = 44;
  const C = 2 * Math.PI * R;
  const seg = (n: number, from: number, color: string) => (
    <Circle cx={52} cy={52} r={R} fill="none" stroke={color} strokeWidth={10} strokeDasharray={`${(n / Math.max(fleet.total, 1)) * C} ${C}`} strokeDashoffset={-from} rotation={-90} origin="52, 52" />
  );
  return (
    <PressableScale
      accessibilityLabel={`Fleet health: ${fleet.online} of ${fleet.total} servers online, ${fleet.degraded} degraded, ${fleet.offline} offline`}
      onPress={onPress}
      style={{ marginTop: 16, padding: 18, gap: 20, flexDirection: 'row', alignItems: 'center', borderRadius: 24, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}
    >
      <View style={{ width: 104, height: 104 }}>
        <Svg width={104} height={104} viewBox="0 0 104 104">
          <Circle cx={52} cy={52} r={R} fill="none" stroke={colors.line} strokeWidth={10} />
          {fleet.total ? seg(fleet.online, 0, colors.ok) : null}
          {fleet.degraded ? seg(fleet.degraded, (fleet.online / fleet.total) * C, colors.warn) : null}
          {fleet.offline ? seg(fleet.offline, ((fleet.online + fleet.degraded) / fleet.total) * C, colors.crit) : null}
        </Svg>
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Text f="display600" size={24} lh={26} color={colors.textStrong}>
            {fleet.online}
            <Text size={15} color={colors.muted}>
              /{fleet.total}
            </Text>
          </Text>
          <Text size={11} color={colors.muted}>
            online
          </Text>
        </View>
      </View>
      <View style={{ flex: 1, gap: 9 }}>
        <Text f="body600" size={13} lh={18} color={colors.text2}>
          Fleet health
        </Text>
        <Legend color={colors.ok} label={`${fleet.online} online`} round />
        <Legend color={colors.warn} label={`${fleet.degraded} degraded`} />
        <Legend color={colors.crit} label={`${fleet.offline} offline`} diamond />
      </View>
      <Icon name="chevronRight" size={18} color={colors.muted} />
    </PressableScale>
  );
}

function Legend({ color, label, round, diamond }: { color: string; label: string; round?: boolean; diamond?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 8, height: 8, borderRadius: round ? 4 : 2, backgroundColor: color, transform: diamond ? [{ rotate: '45deg' }] : undefined }} />
      <Text size={14} lh={20}>
        {label}
      </Text>
    </View>
  );
}

function Tile({ icon, tone, where, value, note, bad, onPress }: { icon: IconName; tone: 'ok' | 'warn'; where: string; value: string; note: string; bad?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale accessibilityLabel={`${where}: ${value}, ${note}`} onPress={onPress} style={{ flex: 1, padding: 16, gap: 12, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconTile icon={icon} tone={tone} size={34} iconSize={18} radius={11} />
        <Text size={12} color={colors.muted}>
          {where}
        </Text>
      </View>
      <View style={{ gap: 2 }}>
        <Text f="display600" size={22} lh={26} color={colors.textStrong}>
          {value}
        </Text>
        <Text size={13} lh={18} color={bad ? colors.critText : colors.muted} numberOfLines={1}>
          {note}
        </Text>
      </View>
    </PressableScale>
  );
}
