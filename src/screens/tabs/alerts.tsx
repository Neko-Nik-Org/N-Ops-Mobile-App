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

import { Empty, Screen } from '@/components/Page';
import { useDashboard } from '@/lib/dashboard';

// shortcut: the API only sends alert counts, not alert rows, so the inbox shows a summary.
export default function Alerts() {
  const { data, loading, refreshing, refresh, error } = useDashboard();
  const n = data?.alertsSent24h ?? 0;
  return (
    <Screen title="Inbox" loading={loading} error={error} onRefresh={() => void refresh()} refreshing={refreshing}>
      <Empty
        icon="bell"
        title={n ? `${n} ${n === 1 ? 'alert' : 'alerts'} sent in the last 24h` : 'No alerts'}
        body={n && data?.alertsLatestSource ? `Latest from ${data.alertsLatestSource}${data.alertsLatestTime ? `, ${data.alertsLatestTime}` : ''}.` : 'Server alerts, workflow results and Vault changes will show here.'}
      />
    </Screen>
  );
}
