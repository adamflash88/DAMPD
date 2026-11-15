import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ReactNode } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, View } from 'react-native';

import { colors, layout, spacing, touch } from '../../theme/tokens';
import { Text } from './Text';

/** Disclosure row inside a card: title + summary, expands to reveal children. */
export function Collapsible({
  title,
  summary,
  initiallyOpen = false,
  children,
}: {
  title: string;
  summary?: string;
  initiallyOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View>
      <Pressable
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen((o) => !o);
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}${summary ? `, ${summary}` : ''}`}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <Text variant="bodyStrong" style={styles.title}>
          {title}
        </Text>
        {summary && !open ? (
          <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.summary}>
            {summary}
          </Text>
        ) : null}
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touch.row,
    paddingHorizontal: layout.cardPadding,
  },
  pressed: { backgroundColor: colors.surfaceRaised },
  title: { flexShrink: 0 },
  summary: { flex: 1, textAlign: 'right' },
  body: { paddingHorizontal: layout.cardPadding, paddingBottom: spacing.md, gap: spacing.xs },
});
