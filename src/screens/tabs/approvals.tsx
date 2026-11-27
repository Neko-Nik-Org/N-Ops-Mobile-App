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

import { IconTile } from '@/components/Bits';
import { SmallButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { Empty, Screen } from '@/components/Page';
import { Text } from '@/components/Text';
import { useDashboard } from '@/lib/dashboard';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

// shortcut: only "waiting on you" exists in the API (/dashboard/overview); "your requests" and history need routes that don't exist yet.
export default function Approvals() {
  const { colors } = useTheme();
  const { data, loading, refreshing, refresh, error, approvedIds, decide } = useDashboard();
  const pending = (data?.approvals ?? []).filter((a) => !approvedIds.has(a.id));

  return (
    <Screen title="Approvals" loading={loading} error={error} onRefresh={() => void refresh()} refreshing={refreshing}>
      {pending.length ? (
        <>
          <Text f="body600" size={13} lh={18} color={colors.text2} style={{ marginTop: 20, marginBottom: 8, marginLeft: 4 }}>
            Waiting on you · {pending.length}
          </Text>
          <View style={{ gap: 12 }}>
            {pending.map((a) => (
              <View key={a.id} style={{ padding: 16, gap: 14, borderRadius: radius.card, borderWidth: 1, borderColor: colors.violetLine, backgroundColor: colors.surface }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <IconTile icon="refresh" tone="violet" size={40} iconSize={20} radius={12} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text f="body600" size={16} lh={22} color={colors.textStrong}>
                      {a.action}
                    </Text>
                    <Text size={13} lh={18} color={colors.muted}>
                      {a.target}
                    </Text>
                    <Text f="mono400" size={12} lh={16} color={colors.muted}>
                      {a.code} · {a.expiresLabel}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <SmallButton label="Reject" variant="outline" onPress={() => void decide(a.id, a.action, false)} />
                  <SmallButton label="Approve" variant="primary" onPress={() => void decide(a.id, a.action, true)} />
                </View>
              </View>
            ))}
          </View>
          <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="faceId" size={16} color={colors.muted} />
            <Text size={13} lh={18} color={colors.muted}>
              Approving asks for Face ID or your PIN.
            </Text>
          </View>
        </>
      ) : (
        <Empty icon="shieldCheck" title="Nothing waiting on you" body="Requests that need your approval will show here." />
      )}
    </Screen>
  );
}
