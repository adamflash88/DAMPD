import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, touch } from '../../theme/tokens';
import { Text } from './Text';

type IconName = ComponentProps<typeof Ionicons>['name'];
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  disabled?: boolean;
  /** Stretch to fill the row (default true for lg). */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

const heights: Record<Size, number> = { sm: touch.buttonSm, md: touch.buttonMd, lg: touch.buttonLg };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  block = size === 'lg',
  style,
  accessibilityHint,
}: ButtonProps) {
  const fg = variant === 'primary' ? colors.onAccent : variant === 'danger' ? colors.danger : variant === 'ghost' ? colors.accent : colors.textPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={size === 'sm' ? 6 : 0}
      style={({ pressed }) => [
        styles.base,
        { minHeight: heights[size], paddingHorizontal: size === 'sm' ? spacing.md : spacing.lg },
        block && styles.block,
        variantStyles[variant],
        pressed && (variant === 'primary' ? styles.primaryPressed : styles.pressed),
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={size === 'lg' ? 20 : 17} color={fg} /> : null}
      <Text
        variant={size === 'lg' ? 'headline' : size === 'sm' ? 'subhead' : 'bodyStrong'}
        style={[{ color: fg }, size === 'lg' && styles.lgLabel]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  tone = 'default',
}: {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: 'default' | 'accent';
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={20} color={tone === 'accent' ? colors.accent : colors.textPrimary} />
    </Pressable>
  );
}

/** Inline text action, e.g. "See all" next to a section title. */
export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="link" accessibilityLabel={label}>
      {({ pressed }) => (
        <Text variant="subhead" tone="accent" style={pressed ? styles.pressed : undefined}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surfaceHigh },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.dangerMuted },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  block: { alignSelf: 'stretch' },
  lgLabel: { fontWeight: '800', letterSpacing: 0.6 },
  pressed: { opacity: 0.65 },
  primaryPressed: { backgroundColor: colors.accentPressed },
  disabled: { opacity: 0.35 },
  icon: {
    width: touch.min,
    height: touch.min,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
});

/** Large two-up action tile (icon over label) for primary trackside actions. */
export function ActionTile({
  label,
  icon,
  onPress,
  variant = 'primary',
  accessibilityHint,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  accessibilityHint?: string;
}) {
  const fg = variant === 'primary' ? colors.onAccent : colors.textPrimary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        tileStyles.tile,
        variant === 'primary' ? { backgroundColor: pressed ? colors.accentPressed : colors.accent } : { backgroundColor: colors.surfaceHigh },
        pressed && variant !== 'primary' && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={22} color={fg} />
      <Text variant="subhead" numberOfLines={2} align="center" style={[tileStyles.label, { color: fg }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const tileStyles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
  },
  label: { fontWeight: '800', letterSpacing: 0.4, lineHeight: 16 },
});
