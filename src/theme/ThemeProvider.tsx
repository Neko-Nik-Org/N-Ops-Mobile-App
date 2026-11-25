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
