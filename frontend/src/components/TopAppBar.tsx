import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { usePathname } from 'expo-router';

import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radius, fontSize, layout } from '@/src/theme/tokens';
import { NAV_ROUTES } from '@/src/nav/routes';

interface TopAppBarProps {
  showMenu: boolean;
  onMenuPress: () => void;
}

export function TopAppBar({ showMenu, onMenuPress }: TopAppBarProps) {
  const { colors, mode, toggleTheme } = useTheme();
  const pathname = usePathname();

  const activeRoute =
    NAV_ROUTES.find((r) => (r.path === '/' ? pathname === '/' || pathname === '' : r.path === pathname)) ??
    NAV_ROUTES[0];

  return (
    <View
      testID="top-app-bar"
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.left}>
        {showMenu ? (
          <Pressable
            testID="menu-toggle-button"
            onPress={onMenuPress}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: pressed ? colors.surfaceSecondary : 'transparent',
              },
            ]}
            hitSlop={8}
          >
            <Feather name="menu" size={22} color={colors.onSurface} />
          </Pressable>
        ) : null}

        <View style={styles.titleWrap}>
          <Text style={[styles.crumb, { color: colors.onSurfaceTertiary }]} numberOfLines={1}>
            Detergent Formulator Pro
          </Text>
          <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
            {activeRoute.label}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Pressable
          testID="search-button"
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: pressed ? colors.surfaceSecondary : 'transparent',
            },
          ]}
          hitSlop={8}
        >
          <Feather name="search" size={20} color={colors.onSurfaceSecondary} />
        </Pressable>

        <Pressable
          testID="theme-toggle-button"
          onPress={toggleTheme}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: pressed ? colors.surfaceSecondary : 'transparent',
            },
          ]}
          hitSlop={8}
        >
          <Feather
            name={mode === 'dark' ? 'sun' : 'moon'}
            size={20}
            color={colors.onSurfaceSecondary}
          />
        </Pressable>

        <View style={[styles.avatar, { backgroundColor: colors.brandTertiary }]}>
          <Text style={[styles.avatarText, { color: colors.onBrandTertiary }]}>DF</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: layout.topBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    minWidth: 0,
    flex: 1,
  },
  crumb: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginTop: 1,
    letterSpacing: -0.3,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  avatarText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
