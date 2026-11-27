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

import { useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { useSession } from '@/lib/session';
import { useTheme } from '@/theme/ThemeProvider';
import { LogoMark } from './Logo';

/** Covers the app while it isn't in front, so the app switcher never shows the dashboard. */
export function PrivacyCover() {
  const { colors } = useTheme();
  const { session } = useSession();
  const [away, setAway] = useState(false);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setAway(s !== 'active'));
    return () => sub.remove();
  }, []);
  if (!away || !session) return null;
  return (
    <View style={[StyleSheet.absoluteFill, styles.cover, { backgroundColor: colors.bg }]} pointerEvents="none">
      <LogoMark size={64} />
    </View>
  );
}

const styles = StyleSheet.create({ cover: { alignItems: 'center', justifyContent: 'center', zIndex: 1000 } });
