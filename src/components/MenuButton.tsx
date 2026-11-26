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

import { DrawerActions } from '@react-navigation/native';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { navRef } from '@/lib/router';
import { PERMANENT_W } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { PressableScale } from './Buttons';
import { Icon } from './Icon';

/** Opens the drawer; hidden when the drawer is a permanent side panel. */
export function MenuButton() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  if (width >= PERMANENT_W) return null;
  return (
    <PressableScale
      accessibilityLabel="Open menu"
      onPress={() => navRef.isReady() && navRef.dispatch(DrawerActions.openDrawer())}
      style={[styles.btn, { backgroundColor: colors.surface }]}
    >
      <Icon name="menu" size={20} color={colors.text} strokeWidth={1.9} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({ btn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' } });
