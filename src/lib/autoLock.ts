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

import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { DRAWER_ROUTES } from './menu';
import { hasPin } from './pin';
import { loadPrefs } from './prefs';
import { navRef, router } from './router';
import { useSession } from './session';

/**
 * Locks again when the app comes back after a minute in the background. The lock opens over the
 * screen the user left (`resume=1`), and unlocking returns to it. Only applies while they're inside the app.
 */
export function useAutoLock() {
  const { session } = useSession();
  const leftAt = useRef<number | null>(null);
  const wentBackground = useRef(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') {
        leftAt.current ??= Date.now();
        if (next === 'background') wentBackground.current = true;
        return;
      }
      const t = leftAt.current;
      const real = wentBackground.current; // "inactive" alone is a Face ID prompt or a system dialog
      leftAt.current = null;
      wentBackground.current = false;
      if (!t || !real || !session) return;
      const name = navRef.isReady() ? navRef.getCurrentRoute()?.name : undefined;
      if (!name || !DRAWER_ROUTES.includes(name)) return;
      void loadPrefs().then(async (p) => {
        if (Date.now() - t >= p.autoLockMs && (await hasPin())) router.push({ pathname: '/lock', params: { resume: '1' } });
      });
    });
    return () => sub.remove();
  }, [session]);
}
