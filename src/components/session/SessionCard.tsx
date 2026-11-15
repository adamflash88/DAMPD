import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { labelFor, DIRT_TYPES, MOISTURE_LEVELS } from '../../domain/labels';
import { sessionTitle, summarizeSession } from '../../domain/session';
import type { RunOutcome, Session } from '../../domain/types';
import { colors, layout, radius, spacing } from '../../theme/tokens';
import { Text } from '../ui';

export const OUTCOME_STYLE: Record<RunOutcome, { label: string; color: string; icon: 'arrow-up' | 'arrow-down' | 'remove' | 'help' }> = {
  better: { label: 'Better', color: colors.accent, icon: 'arrow-up' },
  worse: { label: 'Worse', color: colors.danger, icon: 'arrow-down' },
  same: { label: 'No change', color: colors.textSecondary, icon: 'remove' },
  unsure: { label: 'Unsure', color: colors.textTertiary, icon: 'help' },
};

export function OutcomeTag({ outcome }: { outcome: RunOutcome }) {
  const s = OUTCOME_STYLE[outcome];
  return (
    <View style={styles.tag} accessibilityLabel={`Outcome: ${s.label}`}>
      <Ionicons name={s.icon} size={12} color={s.color} />
      <Text variant="caption" style={{ color: s.color, fontWeight: '600' }}>
        {s.label}
      </Text>
    </View>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export { formatDate };

export function SessionCard({
  session,
  bikeName,
  onPress,
  selected,
  selectable,
  onToggleSelect,
}: {
  session: Session;
  bikeName?: string;
  onPress: () => void;
  selected?: boolean;
  selectable?: boolean;
  onToggleSelect?: () => void;
}) {
  const sum = summarizeSession(session);
  const c = session.conditions;
  const conditions = [labelFor(DIRT_TYPES, c.dirtType), labelFor(MOISTURE_LEVELS, c.moisture)].filter(Boolean).join(' · ');
  const meta = [formatDate(session.date), bikeName, conditions].filter(Boolean).join(' · ');

  return (
    <View style={[styles.card, selected && styles.cardSelected]}>
      {selectable ? (
        <Pressable
          onPress={onToggleSelect}
          hitSlop={6}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: !!selected }}
          accessibilityLabel={`Select ${sessionTitle(session)} for comparison`}
          style={styles.check}
        >
          <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={selected ? colors.accent : colors.textTertiary} />
        </Pressable>
      ) : null}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${sessionTitle(session)}, ${meta}, ${sum.testRuns} runs, ${sum.adjustments} adjustments`}
        style={({ pressed }) => [styles.body, pressed && styles.pressed, !selectable && styles.bodyPadLeft]}
      >
        <View style={styles.titleRow}>
          <Text variant="headline" numberOfLines={1} style={styles.flex}>
            {sessionTitle(session)}
          </Text>
          {session.status === 'active' ? (
            <View style={styles.live}>
              <View style={styles.liveDot} />
              <Text variant="overline" tone="accent">
                Live
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {meta}
        </Text>
        <View style={styles.stats}>
          <Stat value={sum.testRuns} label={sum.testRuns === 1 ? 'run' : 'runs'} />
          <Stat value={sum.adjustments} label={sum.adjustments === 1 ? 'change' : 'changes'} />
          {sum.outcomes.better > 0 ? <Stat value={sum.outcomes.better} label="better" color={colors.accent} /> : null}
          {sum.outcomes.worse > 0 ? <Stat value={sum.outcomes.worse} label="worse" color={colors.danger} /> : null}
        </View>
      </Pressable>
    </View>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="value" style={color ? { color } : undefined}>
        {value}
      </Text>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardSelected: { borderColor: colors.accent, backgroundColor: colors.surfaceRaised },
  check: { width: 48, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, paddingVertical: spacing.md, paddingRight: layout.cardPadding, gap: 3 },
  bodyPadLeft: { paddingLeft: layout.cardPadding },
  pressed: { opacity: 0.75 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  live: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  stats: { flexDirection: 'row', gap: spacing.lg, marginTop: 4 },
  stat: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
