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

import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useDashboard } from '@/lib/dashboard';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from './Icon';
import { Text } from './Text';

/** Scopes the whole app to one tag (or all). Hidden until tags load; disabled with no tags. */
export function TagSelect() {
  const { colors } = useTheme();
  const { tags, selectedTagId, setSelectedTagId } = useDashboard();
  const [open, setOpen] = useState(false);
  if (!tags) return null;
  const empty = tags.length === 0;
  const label = empty ? 'No tags' : (tags.find((t) => t.tagId === selectedTagId)?.tagName ?? 'All tags');

  const options = [{ id: null as number | null, name: 'All tags' }, ...tags.map((t) => ({ id: t.tagId as number | null, name: t.tagName }))];

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Tag: ${label}`}
        disabled={empty}
        onPress={() => setOpen(true)}
        style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.line, opacity: empty ? 0.6 : 1 }]}
      >
        <Icon name="tag" size={15} color={colors.muted} strokeWidth={2.2} />
        <Text f="body600" size={14} lh={18} color={colors.textStrong} numberOfLines={1} style={{ flexShrink: 1 }}>
          {label}
        </Text>
        <Icon name="chevronDown" size={16} color={colors.muted} strokeWidth={2.2} />
      </Pressable>
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)} supportedOrientations={['portrait', 'landscape']}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close">
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <ScrollView>
              {options.map((o) => {
                const on = o.id === selectedTagId;
                return (
                  <Pressable
                    key={String(o.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => {
                      setSelectedTagId(o.id);
                      setOpen(false);
                    }}
                    style={[styles.option, on && { backgroundColor: colors.okSoft }]}
                  >
                    <Text f={on ? 'body600' : 'body500'} size={15} lh={20} color={on ? colors.accent : colors.text} style={{ flex: 1 }}>
                      {o.name}
                    </Text>
                    {on ? <Icon name="check" size={18} color={colors.accent} strokeWidth={2.4} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: { height: 36, alignSelf: 'flex-start', maxWidth: '100%', paddingLeft: 12, paddingRight: 10, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 360, maxHeight: '70%', borderRadius: 16, borderWidth: 1, padding: 8 },
  option: { height: 48, paddingHorizontal: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
});
