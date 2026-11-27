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

import { type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { brand, radius } from '@/theme/tokens';
import { PressableScale } from './Buttons';
import { Banner, Skeleton } from './Loading';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/** Room under the content. */
const BOTTOM_SPACE = 32;

/** Page frame from the design: big title, optional right action, then the content. */
export function Screen({
  title,
  action,
  loading,
  error,
  onRefresh,
  refreshing,
  children,
}: {
  title: string;
  action?: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: BOTTOM_SPACE,
        }}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[brand.mint]}
            />
          ) : undefined
        }
      >
        <View style={styles.head}>
          <Text
            f="display600"
            size={32}
            lh={38}
            ls={-0.64}
            color={colors.textStrong}
            accessibilityRole="header"
            style={{ flex: 1 }}
          >
            {title}
          </Text>
          {action}
        </View>
        {error ? (
          <View style={{ marginTop: 14 }}>
            <Banner tone="warn" title={error} />
          </View>
        ) : null}
        {loading ? (
          <View style={{ gap: 12, marginTop: 20 }}>
            <Skeleton height={120} round={radius.card} />
            <Skeleton height={160} round={radius.card} />
          </View>
        ) : (
          children
        )}
      </ScrollView>
    </View>
  );
}

/** Small bordered button next to a title (Sort, New…). */
export function HeadButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.headBtn,
        { backgroundColor: colors.surface, borderColor: colors.line },
      ]}
    >
      {icon ? <Icon name={icon} size={16} color={colors.text2} /> : null}
      <Text f="body500" size={13} lh={18} color={colors.text2}>
        {label}
      </Text>
    </PressableScale>
  );
}

/** "Needs attention 1" style heading above a group card. */
export function GroupTitle({
  title,
  count,
}: {
  title: string;
  count?: number | string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.groupTitle}>
      <Text
        f="body600"
        size={13}
        lh={18}
        color={colors.text2}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {count !== undefined ? (
        <Text f="mono500" size={12} lh={16} color={colors.muted}>
          {count}
        </Text>
      ) : null}
    </View>
  );
}

/** Rounded card whose children are rows separated by hairlines. */
export function ListCard({
  children,
  border,
}: {
  children: ReactNode;
  border?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.list,
        { backgroundColor: colors.surface, borderColor: border ?? colors.line },
      ]}
    >
      {children}
    </View>
  );
}

/** One row of a ListCard. Pass `first` for the top row (no divider). */
export function ListRow({
  first,
  height = 64,
  onPress,
  label,
  children,
  chevron,
}: {
  first?: boolean;
  height?: number;
  onPress?: () => void;
  label: string;
  children: ReactNode;
  chevron?: boolean;
}) {
  const { colors } = useTheme();
  const body = (
    <>
      {children}
      {chevron ? (
        <Icon name="chevronRight" size={16} color={colors.muted} />
      ) : null}
    </>
  );
  const style = [
    styles.row,
    {
      minHeight: height,
      borderTopWidth: first ? 0 : 1,
      borderTopColor: colors.line2,
    },
  ];
  return onPress ? (
    <PressableScale accessibilityLabel={label} onPress={onPress} style={style}>
      {body}
    </PressableScale>
  ) : (
    <View accessible accessibilityLabel={label} style={style}>
      {body}
    </View>
  );
}

/** Shown where the server has nothing (or doesn't have the feature yet). */
export function Empty({
  icon,
  title,
  body,
}: {
  icon: IconName;
  title: string;
  body: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.empty,
        { backgroundColor: colors.surface, borderColor: colors.line },
      ]}
    >
      <Icon name={icon} size={22} color={colors.muted} />
      <Text f="body600" size={15} lh={20}>
        {title}
      </Text>
      <Text size={13} lh={19} color={colors.muted} align="center">
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headBtn: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupTitle: {
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  list: { borderRadius: radius.card, borderWidth: 1, overflow: 'hidden' },
  row: {
    paddingLeft: 16,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  empty: {
    marginTop: 20,
    padding: 24,
    borderRadius: radius.card,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
});
