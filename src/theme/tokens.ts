/**
 * DAMPD design tokens. Every color, spacing step, radius, size and type style
 * used by the UI lives here. Components read tokens; screens use components.
 */
import type { TextStyle } from 'react-native';

export const colors = {
  // Surfaces: near-black charcoal, layered by subtle contrast.
  background: '#0B0C0E',
  surface: '#15171A',
  surfaceRaised: '#1C1F23',
  surfaceHigh: '#262A2F',
  border: '#24282D',
  borderStrong: '#363B42',

  textPrimary: '#FFFFFF',
  textSecondary: '#9DA3AA',
  textTertiary: '#6A7078',

  accent: '#C6FF00', // electric lime: primary actions, active state, key numbers
  accentPressed: '#ADE000',
  accentMuted: 'rgba(198, 255, 0, 0.12)',
  onAccent: '#0B0C0E',

  warning: '#E3A64A', // restrained amber; demo values, genuine cautions only
  warningMuted: 'rgba(227, 166, 74, 0.12)',
  danger: '#FF5D5D',
  dangerMuted: 'rgba(255, 93, 93, 0.12)',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

/** Layout constants used across screens. */
export const layout = {
  screenPadding: spacing.lg,
  sectionGap: spacing.xl,
  cardPadding: 14,
  cardGap: spacing.md,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/** Touch targets: 44pt minimum (Apple HIG). */
export const touch = {
  min: 44,
  row: 48,
  buttonSm: 36,
  buttonMd: 44,
  buttonLg: 52,
} as const;

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

export const typography = {
  largeTitle: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.4 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.2 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  subhead: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase' },
  /** Numbers: always tabular so columns line up. */
  value: { fontSize: 17, lineHeight: 22, fontWeight: '600', fontVariant: tabular },
  metric: { fontSize: 22, lineHeight: 26, fontWeight: '700', fontVariant: tabular },
  metricLarge: { fontSize: 32, lineHeight: 36, fontWeight: '800', fontVariant: tabular, letterSpacing: -0.5 },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export const theme = { colors, spacing, layout, radius, touch, typography } as const;
export type Theme = typeof theme;
