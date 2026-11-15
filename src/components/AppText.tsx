import { Text, type TextProps } from 'react-native';

import { colors, typography, type TypographyVariant } from '../theme/tokens';

type Tone = 'primary' | 'secondary' | 'muted' | 'accent' | 'illustrative' | 'danger' | 'onAccent';

const toneColor: Record<Tone, string> = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  muted: colors.textMuted,
  accent: colors.accent,
  illustrative: colors.illustrative,
  danger: colors.danger,
  onAccent: colors.onAccent,
};

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  tone?: Tone;
  align?: 'left' | 'center' | 'right';
}

export function AppText({ variant = 'body', tone = 'primary', align, style, ...rest }: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[typography[variant], { color: toneColor[tone] }, align ? { textAlign: align } : null, style]}
    />
  );
}
