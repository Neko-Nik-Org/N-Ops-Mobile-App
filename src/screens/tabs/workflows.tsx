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

import { PressableScale } from '@/components/Buttons';
import { Icon, type IconName } from '@/components/Icon';
import { IconTile } from '@/components/Bits';
import { Empty, GroupTitle, ListCard, ListRow, Screen } from '@/components/Page';
import { Text } from '@/components/Text';
import { api } from '@/lib/api';
import { useDashboard } from '@/lib/dashboard';
import { messageOf } from '@/lib/errors';
import { ago } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { Workflow } from '@/lib/types';
import { useLoad } from '@/lib/useLoad';
import { useTheme } from '@/theme/ThemeProvider';

const TRIGGER: Record<string, { icon: IconName; text: string }> = {
  cron: { icon: 'clock', text: 'On a schedule' },
  interval: { icon: 'clock', text: 'On a schedule' },
  metric: { icon: 'bolt', text: 'When a metric trips' },
  webhook: { icon: 'bolt', text: 'On a webhook' },
  manual: { icon: 'hand', text: 'Manual' },
};
const LIVE = ['running', 'waiting_approval'];

export default function Workflows() {
  const { colors } = useTheme();
  const { session } = useSession();
  const { selectedTagId } = useDashboard();
  const { data, loading, error, reload } = useLoad((s) => api.listWorkflows(s), []);
  const [started, setStarted] = useState<number | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const all = (data ?? []).filter((w) => selectedTagId === null || w.tagId === selectedTagId);
  const live = all.filter((w) => w.lastRunStatus && LIVE.includes(w.lastRunStatus));

  const run = async (w: Workflow) => {
    if (!session) return;
    try {
      await api.runWorkflow(session, w.workflowId);
      setStarted(w.workflowId);
      setRunError(null);
      void reload();
    } catch (e) {
      setRunError(messageOf(e));
    }
  };

  const sub = (w: Workflow) => {
    const t = TRIGGER[w.triggerKind]?.text ?? w.triggerKind;
    return w.lastRunStartedAt ? `${t} · last run ${ago(w.lastRunStartedAt)}` : t;
  };

  return (
    <Screen title="Workflows" loading={loading} error={error ?? runError} onRefresh={() => void reload()}>
      {live.length ? (
        <>
          <GroupTitle title="Running now" />
          <ListCard border={colors.warnLine}>
            {live.map((w, i) => (
              <ListRow key={w.workflowId} first={i === 0} label={`${w.name}, ${w.lastRunStatus}`}>
                <IconTile icon="flow" tone="ok" size={38} iconSize={19} radius={12} />
                <View style={{ flex: 1 }}>
                  <Text f="body600" size={15} lh={20} color={colors.textStrong}>
                    {w.name}
                  </Text>
                  <Text size={12} lh={16} color={colors.muted}>
                    {w.lastRunStatus === 'waiting_approval' ? 'Waiting for approval' : 'Running'}
                  </Text>
                </View>
              </ListRow>
            ))}
          </ListCard>
        </>
      ) : null}
      {all.length ? (
        <>
          <GroupTitle title="All workflows" count={all.length} />
          <ListCard>
            {all.map((w, i) => {
              const t = TRIGGER[w.triggerKind] ?? TRIGGER.manual;
              return (
                <ListRow key={w.workflowId} first={i === 0} height={68} label={w.name}>
                  <IconTile icon={t.icon} tone="surface" size={36} iconSize={18} radius={11} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text f="mono500" size={14} lh={18} color={colors.textStrong} numberOfLines={1}>
                      {w.name}
                    </Text>
                    <Text size={12} lh={16} color={colors.muted} numberOfLines={1}>
                      {w.enabled ? sub(w) : 'Paused'}
                    </Text>
                  </View>
                  <PressableScale
                    accessibilityLabel={`Run ${w.name}`}
                    disabled={!w.enabled}
                    onPress={() => void run(w)}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: started === w.workflowId ? colors.okSoft : colors.raised, alignItems: 'center', justifyContent: 'center', opacity: w.enabled ? 1 : 0.4 }}
                  >
                    <Icon name={started === w.workflowId ? 'check' : 'play'} size={18} color={colors.accent} />
                  </PressableScale>
                </ListRow>
              );
            })}
          </ListCard>
        </>
      ) : (
        <Empty icon="flow" title="No workflows yet" body="Workflows built in the web admin will list here, with a Run button." />
      )}
    </Screen>
  );
}
