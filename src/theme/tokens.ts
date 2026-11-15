/**
 * DAMPD design tokens. Every color, spacing step, radius and type style used by
 * the UI lives here so the look can be tuned in one place.
 */
import type { TextStyle } from 'react-native';

export const colors = {
  // Layered charcoal surfaces (lowest → highest). Never flat black.
  background: '#0F1012',
  surface1: '#17191C',
  surface2: '#1F2226',
  surface3: '#292D32',
  border: '#33383F',
  borderStrong: '#454B53',

  textPrimary: '#FFFFFF',
  textSecondary: '#A1A7AE',
  textMuted: '#6E757D',

  accent: '#C6FF00', // neon lime: active states, CTAs, key numbers
  accentPressed: '#A8D900',
  accentSubtle: 'rgba(198, 255, 0, 0.12)',
  onAccent: '#0F1012',

  illustrative: '#FFB547', // amber: unverified / illustrative data
  illustrativeSubtle: 'rgba(255, 181, 71, 0.14)',
  danger: '#FF5C5C',
  dangerSubtle: 'rgba(255, 92, 92, 0.14)',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

/** Minimum touch target sizes, sized for gloves-off trackside use. */
export const touch = {
  min: 48,
  large: 60,
  stepper: 64,
} as const;

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  /** Settings values: always tabular so columns of numbers line up. */
  value: { fontSize: 22, lineHeight: 28, fontWeight: '700', fontVariant: tabular },
  valueLarge: { fontSize: 36, lineHeight: 42, fontWeight: '800', fontVariant: tabular },
  valueSmall: { fontSize: 16, lineHeight: 22, fontWeight: '600', fontVariant: tabular },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export const theme = { colors, spacing, radius, touch, typography } as const;
export type Theme = typeof theme;
