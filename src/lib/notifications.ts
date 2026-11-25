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
