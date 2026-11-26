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

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { loadPrefs, savePrefs } from '@/lib/prefs';
import { palettes, type Palette, type ThemeName, type ThemePref } from './tokens';

interface ThemeContextValue {
  /** The theme actually on screen. */
  scheme: ThemeName;
  colors: Palette;
  /** What the user picked in Profile → Appearance. */
  pref: ThemePref;
  setPref: (pref: ThemePref) => void;
  /** False until the saved preference has been read (keeps the native splash up). */
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [pref, setPrefState] = useState<ThemePref>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadPrefs()
      .then((p) => setPrefState(p.themePref))
      .finally(() => setReady(true));
  }, []);

  const setPref = useCallback((next: ThemePref) => {
    setPrefState(next);
    void savePrefs({ themePref: next });
  }, []);

  const scheme: ThemeName = pref === 'system' ? (system === 'light' ? 'light' : 'dark') : pref;

  const value = useMemo(
    () => ({ scheme, colors: palettes[scheme], pref, setPref, ready }),
    [scheme, pref, setPref, ready],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
