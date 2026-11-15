import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';

export function Screen({
  children,
  edges = ['top'],
  scroll = true,
}: {
  children: ReactNode;
  edges?: Edge[];
  scroll?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.content]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Card({
  children,
  level = 1,
  highlight = false,
  style,
  ...rest
}: ViewProps & { level?: 1 | 2 | 3; highlight?: boolean }) {
  const bg = level === 1 ? colors.surface1 : level === 2 ? colors.surface2 : colors.surface3;
  return (
    <View
      {...rest}
      style={[styles.card, { backgroundColor: bg }, highlight && { borderColor: colors.accent }, style]}
    >
      {children}
    </View>
  );
}

export function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="label" tone="secondary">
        {title}
      </AppText>
      {right}
    </View>
  );
}

export function Row({ children, style, ...rest }: ViewProps) {
  return (
    <View {...rest} style={[styles.row, style]}>
      {children}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <Card style={styles.empty}>
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      {body ? (
        <AppText tone="secondary" align="center">
          {body}
        </AppText>
      ) : null}
      {action}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
});
