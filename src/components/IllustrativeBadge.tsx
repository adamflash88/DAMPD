import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';

/**
 * Shown next to any value with `isVerified: false`. When `onConfirm` is given,
 * tapping it marks the value as confirmed by the rider.
 */
export function IllustrativeBadge({ onConfirm, compact }: { onConfirm?: () => void; compact?: boolean }) {
  const label = compact ? 'Illustrative' : onConfirm ? 'Illustrative · tap to confirm' : 'Illustrative';
  return (
    <Pressable
      disabled={!onConfirm}
      onPress={onConfirm}
      hitSlop={10}
      accessibilityRole={onConfirm ? 'button' : 'text'}
      accessibilityLabel={onConfirm ? 'Illustrative value, unverified. Tap to confirm.' : 'Illustrative value, unverified'}
      style={({ pressed }) => [styles.badge, pressed && { opacity: 0.7 }]}
    >
      <AppText variant="caption" tone="illustrative" style={styles.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.illustrativeSubtle,
    borderColor: colors.illustrative,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  text: { fontWeight: '700' },
});
