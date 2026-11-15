import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '../../theme/tokens';
import { Text } from './Text';

export interface ScreenProps {
  children: ReactNode;
  /**
   * 'tab': top-level tab screen (draws its own header, respects the top safe
   *        area; the tab bar handles the bottom).
   * 'stack': pushed/modal screen under a native header (respects bottom only).
   */
  kind?: 'tab' | 'stack';
  /** Sticky action area pinned above the bottom safe area. */
  footer?: ReactNode;
  scroll?: boolean;
}

export function Screen({ children, kind = 'stack', footer, scroll = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const edges: Edge[] = kind === 'tab' ? ['top'] : footer ? [] : ['bottom'];
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      // iOS: lifts focused inputs above the keyboard without a wrapper.
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.content]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        // iOS handled by automaticallyAdjustKeyboardInsets above.
        behavior={Platform.OS === 'android' ? 'height' : undefined}
        enabled={Platform.OS === 'android'}
      >
        {body}
        {footer ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>{footer}</View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Header for top-level tab screens: title, optional subtitle and accessory. */
export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.flex}>
        <Text variant="largeTitle" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="subhead" tone="secondary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: layout.sectionGap,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: -spacing.xs },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
});
