import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Polyline } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { easeOut, easePop } from '@/theme/motion';
import { Card, Chip, IconTile, NodeDeco, StatusDot, useFakeQrPath, useFloat } from './Bits';
import { Icon } from './Icon';
import { Text } from './Text';

/**
 * The four welcome illustrations, drawn at the canvas size (342×330) and scaled by the screen.
 * Server names and numbers here are illustration only.
 */

export const ART_W = 342;
export const ART_H = 330;

function Sparkline({ points, color }: { points: string; color: string }) {
  return (
    <Svg width={44} height={18} viewBox="0 0 44 18">
      <Polyline points={points} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* 1 · Fleet ---------------------------------------------------------------- */

const fleet = [
  { name: 'prod-api-01', os: 'Ubuntu 24.04', tone: 'ok', spark: '0,13 8,11 16,12 24,7 32,9 44,5' },
  { name: 'prod-api-02', os: 'Ubuntu 24.04', tone: 'ok', spark: '0,10 8,12 16,8 24,10 32,6 44,8' },
  { name: 'db-primary', os: 'Debian 12', tone: 'warn', spark: '0,12 8,10 16,9 24,6 32,4 44,2' },
  { name: 'edge-proxy-01', os: 'Alpine 3.20', tone: 'ok', spark: '0,9 8,9 16,11 24,8 32,10 44,9' },
] as const;

export function FleetArt() {
  const { colors } = useTheme();
  const float = useFloat();
  return (
    <View style={styles.art}>
      <NodeDeco />
      <Card style={[styles.fleetCard, { boxShadow: colors.shadow }]}>
        <View style={styles.fleetHead}>
          <Text f="display600" size={15} lh={19}>
            Fleet
          </Text>
          <Text f="mono400" size={11} lh={14} color={colors.muted}>
            4 servers
          </Text>
        </View>
        {fleet.map((s) => (
          <View key={s.name} style={[styles.fleetRow, { borderTopColor: colors.line2 }]}>
            <StatusDot tone={s.tone} shape={s.tone === 'warn' ? 'square' : 'circle'} />
            <View style={{ flex: 1 }}>
              <Text f="mono400" size={13} lh={17}>
                {s.name}
              </Text>
              <Text size={11} lh={14} color={colors.muted} style={{ marginTop: 2 }}>
                {s.os}
              </Text>
            </View>
            <Sparkline points={s.spark} color={s.tone === 'ok' ? colors.ok : colors.warn} />
            <Chip label={s.tone === 'ok' ? 'Online' : 'Degraded'} tone={s.tone} />
          </View>
        ))}
      </Card>
      <Animated.View style={[styles.syncChip, { backgroundColor: colors.raised, borderColor: colors.line, boxShadow: colors.shadowSm }, float]}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ok }} />
        <Text f="mono400" size={11} lh={14} color={colors.text2}>
          synced just now
        </Text>
      </Animated.View>
    </View>
  );
}

/* 2 · Approvals ------------------------------------------------------------ */

export function ApprovalArt() {
  const { colors } = useTheme();
  const float = useFloat();
  return (
    <View style={styles.art}>
      <NodeDeco />
      <Card style={[styles.approvalCard, { boxShadow: colors.shadow }]}>
        <View style={styles.rowCenter}>
          <IconTile icon="shieldCheck" tone="violet" iconSize={18} />
          <Text f="body600" size={13} lh={18} color={colors.text2} style={{ flex: 1 }}>
            Needs your approval
          </Text>
          <Text f="mono400" size={11} lh={14} color={colors.muted}>
            2m ago
          </Text>
        </View>
        <Text f="display600" size={20} lh={26} ls={-0.2} color={colors.textStrong}>
          Restart nginx
        </Text>
        <View style={{ gap: 8 }}>
          {[
            ['Server', 'prod-web-03'],
            ['Requested by', 'r.mehta'],
            ['Approvals', '1 of 2'],
          ].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row' }}>
              <Text size={12} lh={16} color={colors.muted} style={{ width: 110 }}>
                {k}
              </Text>
              <Text f="mono400" size={12} lh={16}>
                {v}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.fakeBtn, { borderWidth: 1, borderColor: colors.line }]}>
            <Text f="body600" size={14}>
              Deny
            </Text>
          </View>
          <View style={[styles.fakeBtn, { backgroundColor: colors.primary }]}>
            <Text f="body600" size={14} color={colors.onPrimary}>
              Approve
            </Text>
          </View>
        </View>
      </Card>
      <Animated.View style={[styles.bioChip, { backgroundColor: colors.raised, borderColor: colors.line, boxShadow: colors.shadowSm }, float]}>
        <Icon name="faceId" size={22} color={colors.accent} strokeWidth={1.8} />
        <Text size={12} lh={16} color={colors.text2}>
          Confirmed with biometrics
        </Text>
      </Animated.View>
    </View>
  );
}

/* 3 · Alerts --------------------------------------------------------------- */

/** One loop of the canvas "w-in" animation: drop in, hold, fade (4.5 s). */
function useDropIn(delay: number) {
  const reduce = useReducedMotion();
  const p = useSharedValue(reduce ? 1 : 0);
  const o = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) return;
    p.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: 450, easing: easeOut }), withDelay(3600, withTiming(1, { duration: 0 })), withTiming(0, { duration: 0 })), -1),
    );
    o.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: 450, easing: easeOut }), withDelay(3600, withTiming(0, { duration: 450 }))), -1),
    );
    return () => {
      cancelAnimation(p);
      cancelAnimation(o);
    };
  }, [reduce, delay, p, o]);
  return useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateY: -14 * (1 - p.value) }, { scale: 0.97 + 0.03 * p.value }],
  }));
}

function AlertRow({ delay, tone, icon, title, time, subject, rest }: { delay: number; tone: 'crit' | 'warn' | 'ok'; icon: 'alertCircle' | 'alertTriangle' | 'check'; title: string; time: string; subject: string; rest: string }) {
  const { colors } = useTheme();
  const anim = useDropIn(delay);
  return (
    <Animated.View
      style={[
        styles.alert,
        { backgroundColor: colors.surface, borderColor: tone === 'warn' ? colors.warnLine : colors.line, boxShadow: colors.shadowSm },
        anim,
      ]}
    >
      <IconTile icon={icon} tone={tone} size={36} iconSize={18} strokeWidth={tone === 'warn' ? 2 : 2.2} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text f="body600" size={13} lh={18}>
            {title}
          </Text>
          <Text f="mono400" size={11} lh={16} color={colors.muted}>
            {time}
          </Text>
        </View>
        <Text size={12} lh={17} color={colors.muted}>
          <Text f="mono400" size={12} lh={17} color={colors.text2}>
            {subject}
          </Text>
          {rest}
        </Text>
      </View>
    </Animated.View>
  );
}

export function AlertsArt() {
  return (
    <View style={styles.art}>
      <NodeDeco />
      <View style={styles.alertStack}>
        <AlertRow delay={0} tone="crit" icon="alertCircle" title="Server unreachable" time="now" subject="edge-sg-02" rest=" stopped responding" />
        <AlertRow delay={350} tone="warn" icon="alertTriangle" title="Disk usage high" time="4m" subject="db-primary" rest=" is at 91% on /var/lib" />
        <AlertRow delay={700} tone="ok" icon="check" title="Workflow succeeded" time="12m" subject="nightly-backup" rest=" finished on 6 servers" />
      </View>
    </View>
  );
}

/* 4 · No passwords --------------------------------------------------------- */

function DashedLink() {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const x = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    x.value = withRepeat(withTiming(8, { duration: 400 }), -1);
    return () => cancelAnimation(x);
  }, [reduce, x]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: x.value - 8 }] }));
  return (
    <View style={styles.dashClip}>
      <Animated.View style={[{ flexDirection: 'row', gap: 4 }, anim]}>
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={{ width: 4, height: 2, backgroundColor: colors.accent }} />
        ))}
      </Animated.View>
    </View>
  );
}

function PopCheck() {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const s = useSharedValue(reduce ? 1 : 0.4);
  const o = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) return;
    s.value = withTiming(1, { duration: 600, easing: easePop });
    o.value = withTiming(1, { duration: 300 });
  }, [reduce, s, o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={[styles.popCheck, { backgroundColor: colors.okSoft }, anim]}>
      <Icon name="check" size={20} color={colors.accent} strokeWidth={2.6} />
    </Animated.View>
  );
}

export function TrustArt() {
  const { colors } = useTheme();
  const qr = useFakeQrPath(21, 4242);
  const rows = [
    { icon: 'key', text: 'Its own key, kept in secure hardware' },
    { icon: 'lock', text: 'Locks with Face ID or fingerprint' },
    { icon: 'unlink', text: 'Unlink from the admin panel any time' },
  ] as const;
  return (
    <View style={styles.art}>
      <View style={styles.laptopWrap}>
        <View style={[styles.laptop, { backgroundColor: colors.surface, borderColor: colors.line, boxShadow: colors.shadowSm }]}>
          <View style={{ width: 34, borderRadius: 6, backgroundColor: colors.raised }} />
          <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
            <View style={{ alignSelf: 'stretch', height: 6, borderRadius: 3, backgroundColor: colors.raised }} />
            <View style={styles.qrCard}>
              <Svg width={78} height={78} viewBox="-1 -1 23 23">
                <Path d={qr} fill="#0B1118" />
              </Svg>
            </View>
          </View>
        </View>
        <View style={{ width: 236, height: 8, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: colors.line }} />
        <Text f="mono400" size={10} lh={13} color={colors.muted} style={{ marginTop: 8 }}>
          admin panel
        </Text>
      </View>

      <View style={styles.dashPos}>
        <DashedLink />
      </View>

      <View style={[styles.phone, { backgroundColor: colors.surface, borderColor: colors.line, boxShadow: colors.shadow }]}>
        <PopCheck />
        <Text f="body600" size={11} lh={14} color={colors.text2}>
          Linked
        </Text>
        <Text f="mono400" size={9} lh={12} color={colors.muted}>
          this phone
        </Text>
      </View>

      <View style={styles.trustRows}>
        {rows.map((r) => (
          <View key={r.icon} style={styles.trustRow}>
            <IconTile icon={r.icon} tone="ok" />
            <Text size={14} lh={19} color={colors.text2}>
              {r.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  art: { width: ART_W, height: ART_H },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fleetCard: { position: 'absolute', left: 12, right: 12, top: 36, overflow: 'hidden' },
  fleetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  fleetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  syncChip: {
    position: 'absolute',
    right: 0,
    top: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  approvalCard: { position: 'absolute', left: 12, right: 12, top: 24, padding: 18, gap: 16 },
  fakeBtn: { flex: 1, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  bioChip: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  alertStack: { position: 'absolute', left: 8, right: 8, top: 34, gap: 12 },
  alert: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1 },
  laptopWrap: { position: 'absolute', left: 0, top: 18, width: 206, alignItems: 'center' },
  laptop: {
    width: 206,
    height: 140,
    padding: 10,
    borderWidth: 1,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    flexDirection: 'row',
    gap: 10,
  },
  qrCard: { padding: 5, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6E3DC' },
  dashPos: { position: 'absolute', left: 212, top: 92 },
  dashClip: { width: 34, height: 2, overflow: 'hidden' },
  phone: {
    position: 'absolute',
    left: 250,
    top: 0,
    width: 92,
    height: 184,
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  popCheck: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  trustRows: { position: 'absolute', left: 0, right: 0, top: 206, gap: 8 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 34 },
});
