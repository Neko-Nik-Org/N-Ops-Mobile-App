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

import { useRouter } from '@/lib/router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { IconTile } from '@/components/Bits';
import { PressableScale, SmallButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { Text, type as T } from '@/components/Text';
import { useDashboard } from '@/lib/dashboard';
import { ago, greeting, shortAgo } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { AlertItem, ApprovalRequest } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, radius } from '@/theme/tokens';
import { easeOut } from '@/theme/motion';

const enter = (i: number) => FadeInDown.delay(i * 60).duration(500).easing(easeOut);

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();
  const { session } = useSession();
  const { data, loading, refreshing, refresh, approvedIds, error } = useDashboard();

  const pending = (data?.approvals ?? []).filter((a) => !approvedIds.has(a.id));
  // "Needs your attention" = things only you can act on: approvals waiting for you.
  const attention = pending.length;
  const first = session?.user.firstName;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[styles.content, { paddingTop: 0 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.accent} colors={[brand.mint]} />}
    >
      <Animated.View entering={enter(0)} style={{ marginTop: 16, gap: 4 }}>
        <Text {...T.titleXs} lh={30} color={colors.textStrong} accessibilityRole="header">
          {greeting()}
          {first ? `, ${first}` : ''}
        </Text>
        <Text size={14} lh={20} color={colors.muted}>
          {loading ? 'Checking your fleet…' : attention > 0 ? `${attention} ${attention === 1 ? 'thing needs' : 'things need'} your attention` : 'All quiet. Nothing needs you right now.'}
        </Text>
      </Animated.View>

      {error ? (
        <View style={[styles.banner, { backgroundColor: colors.warnSoft }]}>
          <Icon name="alertTriangle" size={16} color={colors.warnText} />
          <Text size={13} lh={18} color={colors.warnText} style={{ flex: 1 }}>
            {error}
          </Text>
        </View>
      ) : null}

      {loading || !data ? (
        <View style={{ gap: 12, marginTop: 18 }}>
          <View style={[styles.skeleton, { height: 150, backgroundColor: colors.raised }]} />
          <View style={[styles.skeleton, { height: 160, backgroundColor: colors.raised }]} />
        </View>
      ) : (
        <>
          <Animated.View entering={enter(1)}>
            <FleetCard fleet={data.fleet} onAll={() => router.navigate('/servers')} />
          </Animated.View>
          {pending.length > 0 ? (
            <Animated.View entering={enter(2)}>
              <ApprovalCard first={pending[0]} waiting={pending.length} />
            </Animated.View>
          ) : null}
          <Animated.View entering={enter(3)} style={{ marginTop: 20 }}>
            <View style={styles.sectionHead}>
              <Text {...T.label} color={colors.text2} accessibilityRole="header">
                Recent alerts
              </Text>
              <PressableScale accessibilityLabel="See all alerts" onPress={() => router.navigate('/alerts')}>
                <Text f="body600" size={13} lh={18} color={colors.accent}>
                  See all
                </Text>
              </PressableScale>
            </View>
            {data.alerts.slice(0, 3).map((a, i, arr) => (
              <AlertRow key={a.id} alert={a} last={i === arr.length - 1} />
            ))}
          </Animated.View>
        </>
      )}
    </ScrollView>
  );
}

function FleetCard({ fleet, onAll }: { fleet: { total: number; online: number; degraded: number; offline: number }; onAll: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { marginTop: 18, backgroundColor: colors.surface, borderColor: colors.line }]} accessibilityLabel={`Fleet health: ${fleet.total} servers, ${fleet.online} online, ${fleet.degraded} degraded, ${fleet.offline} offline`}>
      <View style={styles.sectionHead}>
        <Text {...T.label} color={colors.text2}>
          Fleet health
        </Text>
        <PressableScale accessibilityLabel="All servers" onPress={onAll}>
          <Text f="body600" size={13} lh={18} color={colors.accent}>
            All servers
          </Text>
        </PressableScale>
      </View>
      <View style={styles.bigNumber}>
        <Text f="display600" size={36} lh={40} ls={-0.72} color={colors.textStrong}>
          {fleet.total}
        </Text>
        <Text size={14} lh={20} color={colors.muted}>
          servers
        </Text>
      </View>
      <View style={styles.bar}>
        <View style={{ flex: fleet.online, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, backgroundColor: colors.ok }} />
        {fleet.degraded > 0 ? <View style={{ flex: fleet.degraded, backgroundColor: colors.warn }} /> : null}
        {fleet.offline > 0 ? <View style={{ flex: fleet.offline, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: colors.crit }} /> : null}
      </View>
      <View style={styles.legend}>
        <Legend color={colors.ok} shape="circle" label={`${fleet.online} online`} />
        <Legend color={colors.warn} shape="square" label={`${fleet.degraded} degraded`} />
        <Legend color={colors.crit} shape="diamond" label={`${fleet.offline} offline`} />
      </View>
    </View>
  );
}

function Legend({ color, shape, label }: { color: string; shape: 'circle' | 'square' | 'diamond'; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.legendItem}>
      <View style={{ width: 8, height: 8, borderRadius: shape === 'circle' ? 4 : 2, backgroundColor: color, transform: shape === 'diamond' ? [{ rotate: '45deg' }] : undefined }} />
      <Text size={12} lh={16} color={colors.text2}>
        {label}
      </Text>
    </View>
  );
}

function ApprovalCard({ first, waiting }: { first: ApprovalRequest; waiting: number }) {
  const { colors } = useTheme();
  const router = useRouter();
  const { approve, approvedIds } = useDashboard();
  const done = approvedIds.has(first.id);
  return (
    <View style={[styles.card, { marginTop: 12, backgroundColor: colors.surface, borderColor: colors.violetLine }]}>
      <View style={styles.sectionHead}>
        <View style={styles.inline}>
          <Icon name="shieldCheck" size={16} color={colors.violetText} />
          <Text {...T.label} color={colors.text2}>
            Approvals
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: colors.violetSoft }]}>
          <Text f="body600" size={12} lh={16} color={colors.violetText}>
            {waiting} waiting
          </Text>
        </View>
      </View>
      <View style={{ gap: 4 }}>
        <Text f="body600" size={16} lh={22} color={colors.textStrong}>
          {first.action} on{' '}
          <Text f="mono500" size={14} lh={22} color={colors.textStrong}>
            {first.target}
          </Text>
        </Text>
        <Text size={12} lh={16} color={colors.muted}>
          Requested by{' '}
          <Text f="mono400" size={12} lh={16} color={colors.text2}>
            {first.requestedBy}
          </Text>{' '}
          · {ago(first.requestedAt)} · {first.approvalsGiven} of {first.approvalsRequired} approvals
        </Text>
      </View>
      {done ? (
        <View style={[styles.approved, { backgroundColor: colors.okSoft }]} accessibilityLiveRegion="polite">
          <Icon name="check" size={18} color={colors.accent} strokeWidth={2.6} />
          <Text f="body600" size={14} lh={18} color={colors.accent}>
            Approved · {first.action.toLowerCase().startsWith('restart') ? 'restart queued' : 'sent'}
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <SmallButton label="Review" variant="outline" onPress={() => router.navigate('/approvals')} />
          <SmallButton label="Approve" variant="primary" onPress={() => void approve(first.id, `${first.action} on ${first.target}`)} />
        </View>
      )}
    </View>
  );
}

function AlertRow({ alert, last }: { alert: AlertItem; last: boolean }) {
  const { colors } = useTheme();
  const tone = alert.severity === 'critical' ? 'crit' : alert.severity === 'warning' ? 'warn' : 'ok';
  const icon = alert.severity === 'critical' ? 'alertCircle' : alert.severity === 'warning' ? 'alertTriangle' : 'check';
  return (
    <View style={[styles.alert, !last && { borderBottomWidth: 1, borderBottomColor: colors.line2 }]} accessibilityLabel={`${alert.title}, ${alert.subject}, ${ago(alert.at)}`}>
      <IconTile icon={icon} tone={tone} strokeWidth={tone === 'ok' ? 2.4 : 2.2} />
      <View style={{ flex: 1 }}>
        <Text f="body500" size={14} lh={19}>
          {alert.title}
        </Text>
        <Text f="mono400" size={12} lh={16} color={colors.muted}>
          {alert.subject}
        </Text>
      </View>
      <Text f="mono400" size={11} lh={14} color={colors.muted}>
        {shortAgo(alert.at)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  banner: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.sm },
  skeleton: { borderRadius: radius.card },
  card: { padding: 16, borderRadius: radius.card, borderWidth: 1, gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bigNumber: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  bar: { flexDirection: 'row', gap: 3, height: 8 },
  legend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  approved: { height: 44, paddingHorizontal: 14, borderRadius: radius.sm, flexDirection: 'row', alignItems: 'center', gap: 10 },
  alert: { height: 54, flexDirection: 'row', alignItems: 'center', gap: 12 },
});
