import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ScreenScaffold, Card } from '@/src/components/ScreenScaffold';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radius, fontSize } from '@/src/theme/tokens';

interface Workflow {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  path: string;
  badge?: string;
}

const WORKFLOWS: Workflow[] = [
  {
    key: 'builder',
    label: 'Formula Builder',
    description: 'Compose and iterate on chemical formulations with precise ratios.',
    icon: 'edit-3',
    path: '/builder',
    badge: 'Author',
  },
  {
    key: 'checker',
    label: 'Formula Checker',
    description: 'Run compliance, safety and stability validation on your formulas.',
    icon: 'check-circle',
    path: '/checker',
    badge: 'Validate',
  },
  {
    key: 'analyzer',
    label: 'Formula Analyzer',
    description: 'Break down physical properties, cost per batch and composition.',
    icon: 'bar-chart-2',
    path: '/analyzer',
    badge: 'Analyze',
  },
  {
    key: 'ai-expert',
    label: 'AI Formula Expert',
    description: 'Ask an AI assistant for substitutions and troubleshooting insights.',
    icon: 'cpu',
    path: '/ai-expert',
    badge: 'Assist',
  },
  {
    key: 'ingredients',
    label: 'Ingredient Library',
    description: 'Manage your raw materials, CAS numbers and user-entered prices.',
    icon: 'droplet',
    path: '/ingredients',
    badge: 'Data',
  },
  {
    key: 'library',
    label: 'Formula Library',
    description: 'Archive of saved recipes, favorites and reusable templates.',
    icon: 'book-open',
    path: '/library',
    badge: 'Archive',
  },
];

interface LabStat {
  key: string;
  label: string;
  value: string;
  hint: string;
  icon: keyof typeof Feather.glyphMap;
  tone: 'brand' | 'info' | 'warning' | 'success';
}

const LAB_STATS: LabStat[] = [
  {
    key: 'ingredients',
    label: 'Total Ingredients',
    value: '0',
    hint: 'In your library',
    icon: 'droplet',
    tone: 'info',
  },
  {
    key: 'formulas',
    label: 'Saved Formulas',
    value: '0',
    hint: 'Across all projects',
    icon: 'layers',
    tone: 'brand',
  },
  {
    key: 'alerts',
    label: 'Inventory Alerts',
    value: '0',
    hint: 'Low-stock materials',
    icon: 'alert-triangle',
    tone: 'warning',
  },
  {
    key: 'activity',
    label: 'Recent Activity',
    value: '0',
    hint: 'Actions in last 24h',
    icon: 'activity',
    tone: 'success',
  },
];

export default function DashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');

  // Responsive columns
  const workflowCols = width >= 1200 ? 3 : width >= 780 ? 2 : 1;
  const statCols = width >= 900 ? 4 : width >= 560 ? 2 : 2;

  return (
    <ScreenScaffold testID="screen-dashboard" title="Dashboard" subtitle="R&D command center" icon="grid">
      {/* Hero */}
      <View testID="dashboard-hero" style={styles.heroWrap}>
        <Card padding={0} testID="dashboard-hero-card">
          <View
            style={[
              styles.hero,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.heroBadge, { backgroundColor: colors.brandTertiary }]}
              testID="hero-badge"
            >
              <View style={[styles.heroBadgeDot, { backgroundColor: colors.brandPrimary }]} />
              <Text
                style={[styles.heroBadgeText, { color: colors.onBrandTertiary }]}
                numberOfLines={1}
              >
                R&D LABORATORY
              </Text>
            </View>

            <Text
              testID="hero-title"
              style={[styles.heroTitle, { color: colors.onSurface }]}
            >
              Professional Detergent R&D Laboratory
            </Text>
            <Text
              testID="hero-subtitle"
              style={[styles.heroSubtitle, { color: colors.onSurfaceSecondary }]}
            >
              Design, analyze, validate and optimize detergent formulations.
            </Text>

            <View style={styles.heroActions}>
              <Pressable
                testID="dashboard-new-formula-btn"
                onPress={() => router.push('/builder')}
                style={({ pressed, hovered }: any) => [
                  styles.primaryCta,
                  {
                    backgroundColor: pressed
                      ? colors.brandSecondary
                      : hovered
                        ? colors.brandSecondary
                        : colors.brandPrimary,
                  },
                ]}
              >
                <View
                  style={[
                    styles.primaryCtaIcon,
                    { backgroundColor: 'rgba(255,255,255,0.14)' },
                  ]}
                >
                  <Feather name="plus" size={22} color={colors.onBrandPrimary} />
                </View>
                <View style={styles.primaryCtaText}>
                  <Text style={[styles.primaryCtaTitle, { color: colors.onBrandPrimary }]}>
                    New Formula
                  </Text>
                  <Text
                    style={[
                      styles.primaryCtaSub,
                      { color: colors.onBrandPrimary, opacity: 0.85 },
                    ]}
                  >
                    Start a fresh formulation in the Builder
                  </Text>
                </View>
                <Feather name="arrow-right" size={20} color={colors.onBrandPrimary} />
              </Pressable>

              <Pressable
                testID="dashboard-open-library-btn"
                onPress={() => router.push('/library')}
                style={({ pressed }) => [
                  styles.secondaryCta,
                  {
                    borderColor: colors.borderStrong,
                    backgroundColor: pressed ? colors.surfaceSecondary : 'transparent',
                  },
                ]}
              >
                <Feather name="book-open" size={16} color={colors.onSurface} />
                <Text style={[styles.secondaryCtaLabel, { color: colors.onSurface }]}>
                  Open Library
                </Text>
              </Pressable>
            </View>
          </View>
        </Card>
      </View>

      {/* Search */}
      <View
        testID="dashboard-search-wrap"
        style={[
          styles.searchWrap,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Feather name="search" size={18} color={colors.onSurfaceTertiary} />
        <TextInput
          testID="dashboard-search-input"
          value={query}
          onChangeText={setQuery}
          placeholder="Search ingredients, formulas, chemicals..."
          placeholderTextColor={colors.onSurfaceTertiary}
          style={[styles.searchInput, { color: colors.onSurface }]}
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Pressable
            testID="dashboard-search-clear"
            onPress={() => setQuery('')}
            hitSlop={8}
            style={styles.searchClear}
          >
            <Feather name="x" size={16} color={colors.onSurfaceTertiary} />
          </Pressable>
        ) : (
          <View style={[styles.kbdHint, { borderColor: colors.border }]}>
            <Text style={[styles.kbdHintText, { color: colors.onSurfaceTertiary }]}>⌘K</Text>
          </View>
        )}
      </View>

      {/* Workflows */}
      <View style={{ gap: spacing.md }}>
        <View style={styles.sectionHead}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Workflows</Text>
            <Text style={[styles.sectionSub, { color: colors.onSurfaceTertiary }]}>
              Jump into any part of the formulation pipeline
            </Text>
          </View>
        </View>

        <View style={styles.grid} testID="dashboard-workflows">
          {WORKFLOWS.map((wf) => (
            <View
              key={wf.key}
              style={[styles.workflowTile, { width: `${100 / workflowCols}%` }]}
            >
              <Pressable
                testID={`workflow-${wf.key}`}
                onPress={() => router.push(wf.path as never)}
                style={({ pressed, hovered }: any) => [
                  styles.workflowInner,
                  {
                    backgroundColor: colors.surface,
                    borderColor:
                      hovered || pressed ? colors.brandPrimary : colors.border,
                  },
                ]}
              >
                <View style={styles.workflowHead}>
                  <View
                    style={[styles.workflowIcon, { backgroundColor: colors.brandTertiary }]}
                  >
                    <Feather name={wf.icon} size={22} color={colors.onBrandTertiary} />
                  </View>
                  {wf.badge ? (
                    <View
                      style={[
                        styles.workflowBadge,
                        { backgroundColor: colors.surfaceSecondary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.workflowBadgeText,
                          { color: colors.onSurfaceSecondary },
                        ]}
                      >
                        {wf.badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.workflowLabel, { color: colors.onSurface }]}>
                  {wf.label}
                </Text>
                <Text
                  style={[styles.workflowDesc, { color: colors.onSurfaceTertiary }]}
                  numberOfLines={3}
                >
                  {wf.description}
                </Text>
                <View style={styles.workflowFooter}>
                  <Text style={[styles.workflowOpen, { color: colors.brandPrimary }]}>
                    Open
                  </Text>
                  <Feather name="arrow-right" size={14} color={colors.brandPrimary} />
                </View>
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      {/* Lab Status */}
      <View style={{ gap: spacing.md }}>
        <View style={styles.sectionHead}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Lab Status</Text>
            <Text style={[styles.sectionSub, { color: colors.onSurfaceTertiary }]}>
              A snapshot of your workspace
            </Text>
          </View>
          <View style={[styles.livePill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.livePillText, { color: colors.onSurfaceSecondary }]}>Live</Text>
          </View>
        </View>

        <View style={styles.grid} testID="lab-status">
          {LAB_STATS.map((stat) => {
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
                testID={`lab-stat-${stat.key}`}
                style={[styles.statTile, { width: `${100 / statCols}%` }]}
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
                  <Text style={[styles.statValue, { color: colors.onSurface }]}>
                    {stat.value}
                  </Text>
                  <Text style={[styles.statHint, { color: colors.onSurfaceTertiary }]}>
                    {stat.hint}
                  </Text>
                </Card>
              </View>
            );
          })}
        </View>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    marginTop: -spacing.sm,
  },
  hero: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    overflow: 'hidden',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: fontSize.lg,
    fontWeight: '500',
    lineHeight: 22,
    maxWidth: 620,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
    alignItems: 'stretch',
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    minHeight: 72,
    flexGrow: 1,
    flexBasis: 280,
    maxWidth: 480,
  },
  primaryCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    flex: 1,
    minWidth: 0,
  },
  primaryCtaTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  primaryCtaSub: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginTop: 2,
  },
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignSelf: 'center',
  },
  secondaryCtaLabel: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: '500',
    padding: 0,
    outlineStyle: 'none' as any,
  },
  searchClear: {
    padding: 4,
  },
  kbdHint: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  kbdHintText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: fontSize.base,
    fontWeight: '500',
    marginTop: 2,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
  },
  livePillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  workflowTile: {
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  workflowInner: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.sm,
    minHeight: 190,
  },
  workflowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workflowIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workflowBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  workflowBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  workflowLabel: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: spacing.xs,
  },
  workflowDesc: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    lineHeight: 18,
  },
  workflowFooter: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  workflowOpen: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.2,
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
    flex: 1,
    minWidth: 0,
  },
  statValue: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1,
  },
  statHint: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
});
