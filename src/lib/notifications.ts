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

import type { NotificationPrefs } from './prefs';
import type { Session } from './types';
import { api } from './api';

/** No-op until push is wired. */
export function configureNotifications() {}

// shortcut: push needs an APNs key + a Firebase project (google-services.json) and a native push module
// (e.g. @react-native-firebase/messaging); until then we only sync the preferences to the server.
export async function enableNotifications(session: Session, prefs: NotificationPrefs): Promise<boolean> {
  await api.updateNotificationPrefs(session, prefs).catch(() => undefined);
  return false;
}
