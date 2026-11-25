import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ThemePref } from '@/theme/tokens';

/** Non-secret, per-device preferences. Secrets live in `session.ts` (Keychain). */

export interface NotificationPrefs {
  approvals: boolean;
  critical: boolean;
  workflows: boolean;
  vault: boolean;
}

export interface Prefs {
  onboardingSeen: boolean;
  setupDone: boolean;
  themePref: ThemePref;
  biometricLock: boolean;
  notifications: NotificationPrefs;
  lastServer: string;
}

export const defaultNotificationPrefs: NotificationPrefs = {
  approvals: true,
  critical: true,
  workflows: true,
  vault: false,
};

export const defaultPrefs: Prefs = {
  onboardingSeen: false,
  setupDone: false,
  themePref: 'system',
  biometricLock: true,
  notifications: defaultNotificationPrefs,
  lastServer: '',
};

const KEY = 'nops.prefs.v1';

let cache: Prefs | null = null;

export async function loadPrefs(): Promise<Prefs> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Prefs>) : {};
    cache = {
      ...defaultPrefs,
      ...parsed,
      notifications: { ...defaultNotificationPrefs, ...(parsed.notifications ?? {}) },
    };
  } catch {
    cache = { ...defaultPrefs };
  }
  return cache;
}

export async function savePrefs(patch: Partial<Prefs>): Promise<Prefs> {
  const current = await loadPrefs();
  cache = { ...current, ...patch };
  await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  return cache;
}

/** Called on unlink: keep appearance, forget everything tied to the old account. */
export async function resetAccountPrefs(): Promise<void> {
  const current = await loadPrefs();
  await savePrefs({
    setupDone: false,
    biometricLock: defaultPrefs.biometricLock,
    notifications: defaultNotificationPrefs,
    themePref: current.themePref,
  });
}
