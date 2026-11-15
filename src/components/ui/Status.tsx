import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { SetupStatus } from '../../domain/setup';
import type { ValueSource } from '../../domain/types';
import { colors, layout, radius, spacing } from '../../theme/tokens';
import { Card } from './Card';
import { Text } from './Text';

const STATUS: Record<SetupStatus, { label: string; color: string }> = {
  complete: { label: 'Complete', color: colors.accent },
  partial: { label: 'Partial', color: colors.warning },
  notConfigured: { label: 'Not configured', color: colors.textTertiary },
};

export function StatusPill({ status }: { status: SetupStatus }) {
  const s = STATUS[status];
  return (
    <View style={styles.pill} accessibilityLabel={`Setup ${s.label}`}>
      <View style={[styles.dot, { backgroundColor: s.color }]} />
      <Text variant="caption" tone="secondary">
        {s.label}
      </Text>
    </View>
  );
}

/**
 * Subtle provenance marker shown next to a value:
 *  demo → small amber dot; manufacturer → small check; user/unknown → nothing.
 */
export function SourceMark({ source }: { source: ValueSource }) {
  if (source === 'demo') return <View style={styles.sourceDot} accessibilityLabel="Demo value" />;
  if (source === 'manufacturer')
    return <Ionicons name="checkmark-circle" size={12} color={colors.textSecondary} accessibilityLabel="Manufacturer verified" />;
  return null;
}

/** One consolidated, restrained notice (instead of repeated badges). */
export function Notice({
  title,
  body,
  action,
  tone = 'warning',
  icon = 'information-circle-outline',
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  tone?: 'warning' | 'neutral';
  icon?: ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={[styles.notice, tone === 'warning' ? styles.noticeWarning : styles.noticeNeutral]}>
      <Ionicons name={icon} size={18} color={tone === 'warning' ? colors.warning : colors.textSecondary} />
      <View style={styles.noticeBody}>
        <Text variant="subhead" style={styles.noticeTitle}>
          {title}
        </Text>
        {body ? (
          <Text variant="caption" tone="secondary">
            {body}
          </Text>
        ) : null}
        {action}
      </View>
    </View>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <Card style={styles.empty}>
      <Text variant="headline" align="center">
        {title}
      </Text>
      {body ? (
        <Text variant="subhead" tone="secondary" align="center">
          {body}
        </Text>
      ) : null}
      {action}
    </Card>
  );
}

/** Compact label/value tile for summaries. */
export function Metric({
  label,
  value,
  unit,
  tone = 'primary',
  mark,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: 'primary' | 'accent' | 'secondary';
  mark?: ReactNode;
}) {
  return (
    <View style={styles.metric} accessible accessibilityLabel={`${label} ${value} ${unit ?? ''}`.trim()}>
      <View style={styles.metricLabelRow}>
        <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.flex}>
          {label}
        </Text>
        {mark}
      </View>
      <View style={styles.metricValueRow}>
        <Text variant="metric" tone={tone} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        {unit ? (
          <Text variant="caption" tone="tertiary" numberOfLines={1}>
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function MetricRow({ children }: { children: ReactNode }) {
  return <View style={styles.metricRow}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
    alignSelf: 'flex-start',
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  sourceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  noticeWarning: { backgroundColor: colors.warningMuted, borderColor: 'rgba(227, 166, 74, 0.35)' },
  noticeNeutral: { backgroundColor: colors.surface, borderColor: colors.border },
  noticeBody: { flex: 1, gap: spacing.xs },
  noticeTitle: { fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  metric: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  metricLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metricValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  metricRow: { flexDirection: 'row', gap: layout.cardGap - 4 },
});
