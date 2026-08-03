import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';

import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radius, fontSize, layout } from '@/src/theme/tokens';
import { NAV_ROUTES } from '@/src/nav/routes';

interface SidebarProps {
  onNavigate?: () => void;
  variant?: 'permanent' | 'drawer';
}

export function Sidebar({ onNavigate, variant = 'permanent' }: SidebarProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (path: string) => {
    router.push(path as never);
    onNavigate?.();
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/' || pathname === '';
    return pathname === path;
  };

  return (
    <View
      testID={`sidebar-${variant}`}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRightColor: colors.border,
          borderRightWidth: variant === 'permanent' ? StyleSheet.hairlineWidth : 0,
        },
      ]}
    >
      {/* Brand */}
      <View style={[styles.brand, { borderBottomColor: colors.divider }]}>
        <View style={[styles.brandBadge, { backgroundColor: colors.brandPrimary }]}>
          <Feather name="droplet" size={18} color={colors.onBrandPrimary} />
        </View>
        <View style={styles.brandTextWrap}>
          <Text style={[styles.brandTitle, { color: colors.onSurface }]} numberOfLines={1}>
            Detergent
          </Text>
          <Text style={[styles.brandSubtitle, { color: colors.onSurfaceTertiary }]} numberOfLines={1}>
            Formulator Pro
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.navScroll}
        contentContainerStyle={styles.navContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceTertiary }]}>WORKSPACE</Text>
        {NAV_ROUTES.slice(0, 4).map((route) => (
          <NavItem
            key={route.key}
            route={route}
            active={isActive(route.path)}
            onPress={() => handleNavigate(route.path)}
          />
        ))}

        <Text style={[styles.sectionLabel, { color: colors.onSurfaceTertiary, marginTop: spacing.lg }]}>
          LIBRARY
        </Text>
        {NAV_ROUTES.slice(4, 7).map((route) => (
          <NavItem
            key={route.key}
            route={route}
            active={isActive(route.path)}
            onPress={() => handleNavigate(route.path)}
          />
        ))}

        <Text style={[styles.sectionLabel, { color: colors.onSurfaceTertiary, marginTop: spacing.lg }]}>
          SYSTEM
        </Text>
        {NAV_ROUTES.slice(7).map((route) => (
          <NavItem
            key={route.key}
            route={route}
            active={isActive(route.path)}
            onPress={() => handleNavigate(route.path)}
          />
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.divider }]}>
        <View style={[styles.versionDot, { backgroundColor: colors.success }]} />
        <Text style={[styles.footerText, { color: colors.onSurfaceTertiary }]}>
          v1.0.0 · Bench Ready
        </Text>
      </View>
    </View>
  );
}

interface NavItemProps {
  route: (typeof NAV_ROUTES)[number];
  active: boolean;
  onPress: () => void;
}

function NavItem({ route, active, onPress }: NavItemProps) {
  const { colors } = useTheme();
  const [hovered, setHovered] = React.useState(false);

  const bg = active
    ? colors.brandTertiary
    : hovered
      ? colors.surfaceSecondary
      : 'transparent';
  const fg = active ? colors.onBrandTertiary : colors.onSurfaceSecondary;

  return (
    <Pressable
      testID={`nav-item-${route.key}`}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.navItem, { backgroundColor: bg }]}
    >
      <Feather name={route.icon} size={18} color={fg} />
      <Text style={[styles.navItemLabel, { color: fg, fontWeight: active ? '600' : '500' }]}>
        {route.label}
      </Text>
      {active ? (
        <View style={[styles.activeIndicator, { backgroundColor: colors.brandPrimary }]} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: layout.sidebarWidth,
    height: '100%',
    flexDirection: 'column',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextWrap: {
    flex: 1,
  },
  brandTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  navScroll: {
    flex: 1,
  },
  navContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
    marginBottom: 2,
    position: 'relative',
  },
  navItemLabel: {
    fontSize: fontSize.base,
    flex: 1,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '25%',
    bottom: '25%',
    width: 3,
    borderRadius: radius.pill,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  versionDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  footerText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
});
