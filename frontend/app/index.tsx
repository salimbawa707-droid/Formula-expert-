import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ScreenScaffold, Card } from '@/src/components/ScreenScaffold';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radius, fontSize } from '@/src/theme/tokens';

interface QuickAction {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  path: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: 'new-formula',
    label: 'New Formula',
    description: 'Start a fresh composition from scratch',
    icon: 'plus-circle',
    path: '/builder',
  },
  {
    key: 'check-formula',
    label: 'Check Formula',
    description: 'Run compliance & safety validation',
    icon: 'check-circle',
    path: '/checker',
  },
  {
    key: 'analyze',
    label: 'Analyze',
    description: 'Physical properties & cost breakdown',
    icon: 'bar-chart-2',
    path: '/analyzer',
  },
  {
    key: 'ask-ai',
    label: 'Ask AI Expert',
    description: 'Get formulation troubleshooting help',
    icon: 'cpu',
    path: '/ai-expert',
  },
];

interface StatTile {
  key: string;
  label: string;
  value: string;
  hint: string;
  icon: keyof typeof Feather.glyphMap;
  tone: 'brand' | 'info' | 'warning' | 'success';
}

const STATS: StatTile[] = [
  { key: 'formulas', label: 'Formulas', value: '0', hint: 'None yet', icon: 'layers', tone: 'brand' },
  { key: 'ingredients', label: 'Ingredients', value: '0', hint: 'Empty library', icon: 'droplet', tone: 'info' },
  { key: 'reports', label: 'Reports', value: '0', hint: 'No PDFs generated', icon: 'file-text', tone: 'success' },
  { key: 'checks', label: 'Checks Run', value: '0', hint: 'No analyses yet', icon: 'activity', tone: 'warning' },
];

export default function DashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Responsive columns for stat tiles + quick actions
  const statCols = width >= 900 ? 4 : width >= 560 ? 2 : 2;
  const actionCols = width >= 1100 ? 4 : width >= 780 ? 3 : width >= 520 ? 2 : 1;

  return (
    <ScreenScaffold
      testID="screen-dashboard"
      title="Welcome back"
      subtitle="Your professional detergent formulation command center"
      icon="grid"
      actions={
        <Pressable
          testID="dashboard-new-formula-btn"
          onPress={() => router.push('/builder')}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: pressed ? colors.brandSecondary : colors.brandPrimary },
          ]}
        >
          <Feather name="plus" size={16} color={colors.onBrandPrimary} />
          <Text style={[styles.primaryBtnLabel, { color: colors.onBrandPrimary }]}>New Formula</Text>
        </Pressable>
      }
    >
      {/* Stat tiles */}
      <View
        testID="dashboard-stats"
        style={[styles.grid, { gap: spacing.md }]}
      >
        {STATS.map((stat) => {
          const tone =
            stat.tone === 'brand'
              ? { bg: colors.brandTertiary, fg: colors.onBrandTertiary }
              : stat.tone === 'info'
                ? { bg: colors.surfaceTertiary, fg: colors.info }
                : stat.tone === 'warning'
                  ? { bg: colors.surfaceTertiary, fg: colors.warning }
                  : { bg: colors.surfaceTertiary, fg: colors.success };
          return (
            <View
              key={stat.key}
              testID={`stat-tile-${stat.key}`}
              style={[
                styles.statTile,
                {
                  width: `${100 / statCols}%`,
                },
              ]}
            >
              <Card>
                <View style={styles.statHead}>
                  <View style={[styles.statIcon, { backgroundColor: tone.bg }]}>
                    <Feather name={stat.icon} size={16} color={tone.fg} />
                  </View>
                  <Text style={[styles.statLabel, { color: colors.onSurfaceTertiary }]}>
                    {stat.label}
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: colors.onSurface }]}>{stat.value}</Text>
                <Text style={[styles.statHint, { color: colors.onSurfaceTertiary }]}>{stat.hint}</Text>
              </Card>
            </View>
          );
        })}
      </View>

      {/* Quick actions */}
      <View style={{ gap: spacing.md }}>
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Quick Actions</Text>
          <Text style={[styles.sectionSub, { color: colors.onSurfaceTertiary }]}>
            Jump into your most common workflows
          </Text>
        </View>

        <View style={[styles.grid, { gap: spacing.md }]}>
          {QUICK_ACTIONS.map((action) => (
            <View
              key={action.key}
              style={[styles.actionTile, { width: `${100 / actionCols}%` }]}
            >
              <Pressable
                testID={`quick-action-${action.key}`}
                onPress={() => router.push(action.path as never)}
                style={({ pressed, hovered }: any) => [
                  styles.actionInner,
                  {
                    backgroundColor: colors.surface,
                    borderColor: hovered || pressed ? colors.brandPrimary : colors.border,
                  },
                ]}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.brandTertiary }]}>
                  <Feather name={action.icon} size={20} color={colors.onBrandTertiary} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.onSurface }]}>{action.label}</Text>
                <Text style={[styles.actionDesc, { color: colors.onSurfaceTertiary }]}>
                  {action.description}
                </Text>
                <View style={styles.actionArrow}>
                  <Feather name="arrow-up-right" size={16} color={colors.onSurfaceTertiary} />
                </View>
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={{ gap: spacing.md }}>
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Recent Activity</Text>
          <Text style={[styles.sectionSub, { color: colors.onSurfaceTertiary }]}>
            Formulas you have recently worked on
          </Text>
        </View>

        <Card testID="recent-activity-empty" padding={spacing['2xl']}>
          <View style={styles.recentEmpty}>
            <View style={[styles.recentEmptyIcon, { backgroundColor: colors.surfaceSecondary }]}>
              <Feather name="clock" size={26} color={colors.onSurfaceTertiary} />
            </View>
            <Text style={[styles.recentEmptyTitle, { color: colors.onSurface }]}>
              No recent formulas
            </Text>
            <Text style={[styles.recentEmptyDesc, { color: colors.onSurfaceTertiary }]}>
              Once you start building formulas, they will appear here for quick access.
            </Text>
            <Pressable
              testID="recent-activity-cta"
              onPress={() => router.push('/builder')}
              style={({ pressed }) => [
                styles.secondaryBtn,
                {
                  backgroundColor: 'transparent',
                  borderColor: colors.brandPrimary,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather name="plus" size={14} color={colors.brandPrimary} />
              <Text style={[styles.secondaryBtnLabel, { color: colors.brandPrimary }]}>
                Build your first formula
              </Text>
            </Pressable>
          </View>
        </Card>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  primaryBtnLabel: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  statTile: {
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  statHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },
  statHint: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  sectionHead: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: fontSize.base,
    fontWeight: '500',
  },
  actionTile: {
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  actionInner: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.sm,
    minHeight: 140,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  actionLabel: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  actionDesc: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: '500',
  },
  actionArrow: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
  },
  recentEmpty: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  recentEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  recentEmptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  recentEmptyDesc: {
    fontSize: fontSize.base,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 380,
    marginBottom: spacing.sm,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  secondaryBtnLabel: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },
});
