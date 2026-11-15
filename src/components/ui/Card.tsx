import Ionicons from '@expo/vector-icons/Ionicons';
import { Children, Fragment, type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors, layout, radius, spacing, touch } from '../../theme/tokens';
import { Text } from './Text';

export function Card({
  children,
  variant = 'plain',
  padded = true,
  style,
  ...rest
}: ViewProps & { variant?: 'plain' | 'raised' | 'accent'; padded?: boolean }) {
  return (
    <View {...rest} style={[styles.card, variantStyle[variant], padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const variantStyle: Record<'plain' | 'raised' | 'accent', ViewStyle> = {
  plain: { backgroundColor: colors.surface },
  raised: { backgroundColor: colors.surfaceRaised },
  accent: { backgroundColor: colors.surfaceRaised, borderColor: colors.accent },
};

/** Titled group: overline label, optional action, then content. */
export function Section({
  title,
  action,
  children,
  style,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.section, style]}>
      {title || action ? (
        <View style={styles.sectionHeader}>
          {title ? (
            <Text variant="overline" tone="secondary" accessibilityRole="header">
              {title}
            </Text>
          ) : (
            <View />
          )}
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** A card whose children are rows separated by hairlines. */
export function ListGroup({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <Card padded={false} style={style}>
      {items.map((child, i) => (
        <Fragment key={i}>
          {i > 0 ? <View style={styles.separator} /> : null}
          {child}
        </Fragment>
      ))}
    </Card>
  );
}

export interface ListRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  valueTone?: 'primary' | 'secondary' | 'accent' | 'warning';
  icon?: ComponentProps<typeof Ionicons>['name'];
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  accessibilityLabel?: string;
}

export function ListRow({
  title,
  subtitle,
  value,
  valueTone = 'secondary',
  icon,
  right,
  onPress,
  chevron = !!onPress,
  accessibilityLabel,
}: ListRowProps) {
  const content = (
    <>
      {icon ? <Ionicons name={icon} size={20} color={colors.textSecondary} style={styles.rowIcon} /> : null}
      <View style={styles.rowText}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="secondary" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="value" tone={valueTone} numberOfLines={1} style={styles.rowValue}>
          {value}
        </Text>
      ) : null}
      {right}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, subtitle, value].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {content}
    </Pressable>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  padded: { padding: layout.cardPadding, gap: spacing.md },
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 20,
    paddingHorizontal: spacing.xs,
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: layout.cardPadding },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touch.row,
    paddingHorizontal: layout.cardPadding,
    paddingVertical: spacing.sm,
  },
  rowPressed: { backgroundColor: colors.surfaceRaised },
  rowIcon: { width: 22 },
  rowText: { flex: 1, gap: 1 },
  rowValue: { maxWidth: '45%' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
