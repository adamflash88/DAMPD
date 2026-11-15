import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AFFECTED_ENDS, CONFIDENCE_LEVELS, DIRT_TYPES, labelFor, MOISTURE_LEVELS, ROUGHNESS_LEVELS, RUT_LEVELS, SITUATIONS, symptomLabel } from '../../domain/labels';
import { describeSetting, formatDelta, formatSetting } from '../../domain/settings';
import { applyAdjustments } from '../../domain/setup';
import type { DisplayUnits, Session, SessionEvent, SymptomReport, TrackConditions } from '../../domain/types';
import { formatQuantity } from '../../domain/units';
import { colors, layout, spacing } from '../../theme/tokens';
import { TextLink, Text } from '../ui';
import { OutcomeTag } from './SessionCard';

export function conditionsSummary(c: TrackConditions, units: DisplayUnits): string {
  const parts = [
    labelFor(DIRT_TYPES, c.dirtType),
    labelFor(MOISTURE_LEVELS, c.moisture),
    c.ruts ? `${labelFor(RUT_LEVELS, c.ruts)} ruts` : null,
    c.roughness ? labelFor(ROUGHNESS_LEVELS, c.roughness) : null,
    c.temperatureC !== null ? formatQuantity('temperature', c.temperatureC, units) : null,
  ].filter(Boolean);
  return parts.join(' · ');
}

export function symptomDetail(s: SymptomReport): string {
  return [
    labelFor(AFFECTED_ENDS, s.end),
    `severity ${s.severity}/5`,
    s.situations.map((x) => labelFor(SITUATIONS, x)).filter(Boolean).join(', ') || null,
    s.confidence !== 'medium' ? labelFor(CONFIDENCE_LEVELS, s.confidence)?.toLowerCase() : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Chronological session record: test runs, adjustments, condition changes. */
export function Timeline({ session, onUndoLast }: { session: Session; onUndoLast?: () => void }) {
  const { events } = session;
  const units = session.snapshot.units;
  if (events.length === 0) {
    return (
      <Text variant="subhead" tone="tertiary" style={styles.empty}>
        Nothing recorded yet. Log feedback after each ride and record every change you make.
      </Text>
    );
  }
  return (
    <View>
      {events.map((e, i) => {
        // Describe adjustments against the setup as it was at that moment.
        const setupAt = applyAdjustments(session.snapshot.setup, events.slice(0, i));
        return (
          <Item key={e.id} event={e} last={i === events.length - 1} units={units} setupAt={setupAt} onUndo={i === events.length - 1 ? onUndoLast : undefined} />
        );
      })}
    </View>
  );
}

function Item({
  event: e,
  last,
  units,
  setupAt,
  onUndo,
}: {
  event: SessionEvent;
  last: boolean;
  units: DisplayUnits;
  setupAt: ReturnType<typeof applyAdjustments>;
  onUndo?: () => void;
}) {
  let icon: IconName = 'flag';
  let color: string = colors.textSecondary;
  let title = '';
  let body: React.ReactNode = null;

  if (e.type === 'testRun') {
    icon = 'flag';
    color = colors.textPrimary;
    title = `Run ${e.runNumber}`;
    body = (
      <>
        {e.outcome ? <OutcomeTag outcome={e.outcome} /> : null}
        {e.symptoms.length === 0 ? (
          <Text variant="caption" tone="secondary">
            No issues reported
          </Text>
        ) : (
          e.symptoms.map((s) => (
            <Text key={s.id} variant="caption" tone="secondary">
              <Text variant="caption" style={styles.strong}>
                {symptomLabel(s)}
              </Text>
              {`  ${symptomDetail(s)}`}
              {s.notes ? ` · “${s.notes}”` : ''}
            </Text>
          ))
        )}
        {e.notes ? (
          <Text variant="caption" tone="secondary">
            “{e.notes}”
          </Text>
        ) : null}
      </>
    );
  } else if (e.type === 'adjustment') {
    icon = 'options';
    color = colors.accent;
    const d = describeSetting(setupAt, e.path);
    title = d ? `${d.end === 'fork' ? 'Fork' : 'Shock'} ${d.label.toLowerCase()}` : e.path;
    const delta = d ? formatDelta(d, e.before, e.after, units) : null;
    body = (
      <>
        <Text variant="subhead">
          {d ? formatSetting(d, e.before, units) : String(e.before)} <Text tone="tertiary">→</Text>{' '}
          <Text variant="subhead" tone="accent">
            {d ? formatSetting(d, e.after, units) : String(e.after)}
          </Text>
        </Text>
        {delta ? (
          <Text variant="caption" tone="secondary">
            {delta.text}
            {delta.direction ? ` · ${delta.direction}` : ''}
          </Text>
        ) : null}
        {e.reason ? (
          <Text variant="caption" tone="secondary">
            Reason: {e.reason}
          </Text>
        ) : null}
      </>
    );
  } else {
    icon = 'partly-sunny-outline';
    title = 'Conditions updated';
    body = (
      <Text variant="caption" tone="secondary">
        {conditionsSummary(e.conditions, units) || 'Cleared'}
      </Text>
    );
  }

  return (
    <View style={styles.item}>
      <View style={styles.rail}>
        <View style={[styles.node, { borderColor: color }]}>
          <Ionicons name={icon} size={12} color={color} />
        </View>
        {!last ? <View style={styles.line} /> : null}
      </View>
      <View style={styles.content}>
        <View style={styles.head}>
          <Text variant="bodyStrong" style={styles.flex}>
            {title}
          </Text>
          {onUndo ? <TextLink label="Undo" onPress={onUndo} /> : null}
          <Text variant="caption" tone="tertiary">
            {time(e.at)}
          </Text>
        </View>
        {body}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  empty: { paddingVertical: spacing.sm },
  strong: { color: colors.textPrimary, fontWeight: '600' },
  item: { flexDirection: 'row', gap: spacing.md },
  rail: { width: 24, alignItems: 'center' },
  node: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  line: { flex: 1, width: 1.5, backgroundColor: colors.border, marginVertical: 2 },
  content: { flex: 1, gap: 3, paddingBottom: layout.cardGap + 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 24 },
});
