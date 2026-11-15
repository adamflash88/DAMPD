import { Text as RNText, type TextProps } from 'react-native';

import { colors, typography, type TypographyVariant } from '../../theme/tokens';

export type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'warning' | 'danger' | 'onAccent';

export const toneColor: Record<Tone, string> = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  tertiary: colors.textTertiary,
  accent: colors.accent,
  warning: colors.warning,
  danger: colors.danger,
  onAccent: colors.onAccent,
};

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  tone?: Tone;
  align?: 'left' | 'center' | 'right';
}

export function Text({ variant = 'body', tone = 'primary', align, style, ...rest }: AppTextProps) {
  return (
    <RNText
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[typography[variant], { color: toneColor[tone] }, align ? { textAlign: align } : null, style]}
    />
  );
}
