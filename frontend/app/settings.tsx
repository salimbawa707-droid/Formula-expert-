import React from 'react';
import { View, Text, Pressable, StyleSheet, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { ScreenScaffold, Card } from '@/src/components/ScreenScaffold';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radius, fontSize } from '@/src/theme/tokens';

interface SettingRow {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  right?: React.ReactNode;
}

export default function SettingsScreen() {
  const { colors, mode, toggleTheme } = useTheme();

  const appearanceRows: SettingRow[] = [
    {
      key: 'dark-mode',
      label: 'Dark Mode',
      description: 'Toggle between light and dark themes',
      icon: 'moon',
      right: (
        <Switch
          testID="settings-dark-mode-switch"
          value={mode === 'dark'}
          onValueChange={toggleTheme}
          trackColor={{ true: colors.brandPrimary, false: colors.surfaceTertiary }}
          thumbColor={colors.surface}
        />
      ),
    },
  ];

  const preferenceRows: SettingRow[] = [
    { key: 'units', label: 'Unit System', description: 'Metric or Imperial', icon: 'sliders' },
    { key: 'currency', label: 'Currency', description: 'Cost calculations & reports', icon: 'dollar-sign' },
    { key: 'precision', label: 'Decimal Precision', description: 'Rounding in outputs', icon: 'hash' },
  ];

  const aboutRows: SettingRow[] = [
    { key: 'version', label: 'App Version', description: '1.0.0', icon: 'info' },
    { key: 'privacy', label: 'Privacy Policy', description: 'How we handle your data', icon: 'lock' },
    { key: 'terms', label: 'Terms of Service', description: 'Usage terms and license', icon: 'file' },
  ];

  return (
    <ScreenScaffold
      testID="screen-settings"
      title="Settings"
      subtitle="App configuration and preferences"
      icon="settings"
    >
      <SettingsSection title="Appearance" rows={appearanceRows} />
      <SettingsSection title="Preferences" rows={preferenceRows} />
      <SettingsSection title="About" rows={aboutRows} />
    </ScreenScaffold>
  );
}

function SettingsSection({ title, rows }: { title: string; rows: SettingRow[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text
        style={{
          fontSize: fontSize.xs,
          fontWeight: '700',
          letterSpacing: 1.2,
          color: colors.onSurfaceTertiary,
          paddingHorizontal: spacing.xs,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
      <Card padding={0}>
        {rows.map((row, idx) => (
          <View key={row.key}>
            <Pressable
              testID={`settings-row-${row.key}`}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: pressed ? colors.surfaceSecondary : 'transparent' },
              ]}
            >
              <View style={[styles.rowIcon, { backgroundColor: colors.surfaceSecondary }]}>
                <Feather name={row.icon} size={16} color={colors.onSurfaceSecondary} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.onSurface }]}>{row.label}</Text>
                <Text style={[styles.rowDesc, { color: colors.onSurfaceTertiary }]}>
                  {row.description}
                </Text>
              </View>
              {row.right ?? (
                <Feather name="chevron-right" size={18} color={colors.onSurfaceTertiary} />
              )}
            </Pressable>
            {idx < rows.length - 1 ? (
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            ) : null}
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  rowDesc: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg + 32 + spacing.md,
  },
});
