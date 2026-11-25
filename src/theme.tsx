import { createContext, ReactNode, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

const dark = { bg: '#0B0F14', surface: '#141A22', ink: '#F4F6F8', mute: '#8B97A6', mint: '#4CF2C0', violet: '#8A7CFF', onMint: '#0B0F14' };
const light = { bg: '#F4F6F8', surface: '#FFFFFF', ink: '#0B0F14', mute: '#5B6776', mint: '#0A9A74', violet: '#6A59F2', onMint: '#FFFFFF' };
export type Palette = typeof dark;

const Ctx = createContext({ c: dark, isDark: true, toggle: () => {} });
export const useTheme = () => useContext(Ctx);

// Follows the system until the user taps the toggle; the choice is not persisted (shortcut: add AsyncStorage when settings exist).
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme() === 'light' ? 'light' : 'dark';
  const [override, setOverride] = useState<'light' | 'dark' | null>(null);
  const mode = override ?? system;
  return (
    <Ctx.Provider value={{ c: mode === 'dark' ? dark : light, isDark: mode === 'dark', toggle: () => setOverride(mode === 'dark' ? 'light' : 'dark') }}>
      {children}
    </Ctx.Provider>
  );
}
