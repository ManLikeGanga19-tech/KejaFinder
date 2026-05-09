// KejaFinder Design System — extracted from wireframes
// Material Design 3 Extended color scheme

export const Colors = {
  // Primary — Deep Navy
  primary: '#00236f',
  primaryContainer: '#1e3a8a',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#90a8ff',
  primaryFixed: '#dce1ff',
  primaryFixedDim: '#b6c4ff',

  // Secondary — Medium Blue
  secondary: '#0060ac',
  secondaryContainer: '#64a8fe',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#003c70',
  secondaryFixed: '#d4e3ff',
  secondaryFixedDim: '#a4c9ff',

  // Tertiary — Warm Amber
  tertiary: '#4b1c00',
  tertiaryContainer: '#6e2c00',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#f39461',
  tertiaryFixed: '#ffdbcb',
  tertiaryFixedDim: '#ffb691',

  // Surface
  surface: '#f9f9fb',
  surfaceBright: '#f9f9fb',
  surfaceDim: '#d9dadc',
  surfaceContainer: '#eeeef0',
  surfaceContainerLow: '#f3f3f5',
  surfaceContainerHigh: '#e8e8ea',
  surfaceContainerHighest: '#e2e2e4',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#1a1c1d',
  onSurfaceVariant: '#444651',

  // Outline
  outline: '#757682',
  outlineVariant: '#c5c5d3',

  // Error
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  // Background
  background: '#f9f9fb',
  onBackground: '#1a1c1d',

  // Utility
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Status
  success: '#1a7a4a',
  successContainer: '#d1fae5',
  warning: '#92400e',
  warningContainer: '#fef3c7',

  // M-Pesa green
  mpesa: '#00a651',
  mpesaLight: '#e8f8f0',
} as const;

export const Typography = {
  fontHeadline: 'System',
  fontBody: 'System',

  size: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
  },

  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  lineHeight: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export const Spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  full: 9999,

  // Component-specific
  card: 24,
  button: 9999,
  chip: 9999,
  modal: 32,
  bottomSheet: 32,
  bottomTab: 32,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#1a1c1d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  md: {
    shadowColor: '#1a1c1d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1a1c1d',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 8,
  },
  xl: {
    shadowColor: '#1a1c1d',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 12,
  },
  primary: {
    shadowColor: '#00236f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

export const Layout = {
  bottomTabHeight: 80,
  topBarHeight: 64,
  screenPaddingH: 24,
  screenPaddingV: 16,
  cardGap: 12,
  sectionGap: 32,
} as const;
