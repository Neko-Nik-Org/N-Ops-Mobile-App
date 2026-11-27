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

// shortcut: the API (and the Admin UI) has no logs route yet, so this is an empty state. Build the list when the route lands.
export default function ServiceLogs() {
  return (
    <Screen title="Service logs">
      <Empty icon="lines" title="Nothing here yet" body="Live service logs will stream here once the server exposes them." />
    </Screen>
  );
}
