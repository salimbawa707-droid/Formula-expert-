// Color and design tokens for Detergent Formulator Pro
// Derived from /app/design_guidelines.json — Slate & Emerald lab/clinical palette

export type ThemeMode = 'light' | 'dark';

export interface ColorTokens {
  surface: string;
  onSurface: string;
  surfaceSecondary: string;
  onSurfaceSecondary: string;
  surfaceTertiary: string;
  onSurfaceTertiary: string;
  surfaceInverse: string;
  onSurfaceInverse: string;
  brand: string;
  brandPrimary: string;
  onBrandPrimary: string;
  brandSecondary: string;
  onBrandSecondary: string;
  brandTertiary: string;
  onBrandTertiary: string;
  success: string;
  onSuccess: string;
  warning: string;
  onWarning: string;
  error: string;
  onError: string;
  info: string;
  onInfo: string;
  border: string;
  borderStrong: string;
  divider: string;
}

export const lightColors: ColorTokens = {
  surface: '#FFFFFF',
  onSurface: '#111827',
  surfaceSecondary: '#F3F4F6',
  onSurfaceSecondary: '#374151',
  surfaceTertiary: '#E5E7EB',
  onSurfaceTertiary: '#4B5563',
  surfaceInverse: '#1F2937',
  onSurfaceInverse: '#F9FAFB',
  brand: '#059669',
  brandPrimary: '#059669',
  onBrandPrimary: '#FFFFFF',
  brandSecondary: '#34D399',
  onBrandSecondary: '#064E3B',
  brandTertiary: '#D1FAE5',
  onBrandTertiary: '#065F46',
  success: '#10B981',
  onSuccess: '#FFFFFF',
  warning: '#F59E0B',
  onWarning: '#FFFFFF',
  error: '#EF4444',
  onError: '#FFFFFF',
  info: '#0EA5E9',
  onInfo: '#FFFFFF',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  divider: '#F3F4F6',
};

export const darkColors: ColorTokens = {
  surface: '#0B111C',
  onSurface: '#F9FAFB',
  surfaceSecondary: '#111827',
  onSurfaceSecondary: '#D1D5DB',
  surfaceTertiary: '#1F2937',
  onSurfaceTertiary: '#9CA3AF',
  surfaceInverse: '#F3F4F6',
  onSurfaceInverse: '#111827',
  brand: '#10B981',
  brandPrimary: '#10B981',
  onBrandPrimary: '#064E3B',
  brandSecondary: '#059669',
  onBrandSecondary: '#D1FAE5',
  brandTertiary: '#064E3B',
  onBrandTertiary: '#A7F3D0',
  success: '#34D399',
  onSuccess: '#064E3B',
  warning: '#FBBF24',
  onWarning: '#78350F',
  error: '#F87171',
  onError: '#7F1D1D',
  info: '#38BDF8',
  onInfo: '#0C4A6E',
  border: '#374151',
  borderStrong: '#4B5563',
  divider: '#1F2937',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const layout = {
  sidebarWidth: 280,
  topBarHeight: 60,
  desktopBreakpoint: 1024,
} as const;

export function getColors(mode: ThemeMode): ColorTokens {
  return mode === 'dark' ? darkColors : lightColors;
}
