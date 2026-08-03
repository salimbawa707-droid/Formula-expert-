import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radius, fontSize } from '@/src/theme/tokens';

interface ScreenScaffoldProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Feather.glyphMap;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  testID?: string;
}

export function ScreenScaffold({
  title,
  subtitle,
  icon,
  actions,
  children,
  testID,
}: ScreenScaffoldProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      testID={testID}
      style={{ flex: 1, backgroundColor: colors.surfaceSecondary }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {icon ? (
            <View style={[styles.headerIcon, { backgroundColor: colors.brandTertiary }]}>
              <Feather name={icon} size={22} color={colors.onBrandTertiary} />
            </View>
          ) : null}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: colors.onSurfaceTertiary }]}>{subtitle}</Text>
            ) : null}
          </View>
        </View>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>

      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  testID?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  onCta,
  testID,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View
      testID={testID ?? 'empty-state'}
      style={[
        styles.empty,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.emptyIcon, { backgroundColor: colors.brandTertiary }]}>
        <Feather name={icon} size={32} color={colors.onBrandTertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>{title}</Text>
      <Text style={[styles.emptyDesc, { color: colors.onSurfaceTertiary }]}>{description}</Text>
      {ctaLabel ? (
        <Pressable
          testID={`${testID ?? 'empty-state'}-cta`}
          onPress={onCta}
          style={({ pressed }) => [
            styles.emptyCta,
            {
              backgroundColor: pressed ? colors.brandSecondary : colors.brandPrimary,
            },
          ]}
        >
          <Text style={[styles.emptyCtaLabel, { color: colors.onBrandPrimary }]}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

interface CardProps {
  children: React.ReactNode;
  padding?: number;
  style?: any;
  testID?: string;
}

export function Card({ children, padding = spacing.lg, style, testID }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.base,
    fontWeight: '500',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  body: {
    gap: spacing.lg,
  },
  empty: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyDesc: {
    fontSize: fontSize.base,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 20,
  },
  emptyCta: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  emptyCtaLabel: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
