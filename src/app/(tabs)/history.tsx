import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { ChipGroup } from '../../components/Inputs';
import { EmptyState, Row, Screen } from '../../components/Layout';
import { useActiveBikeId, useBikes, useSessionsForBike } from '../../data';
import { DIRT_TYPES, labelFor, MOISTURE_LEVELS } from '../../domain/labels';
import { bikeLabel } from '../../domain/setup';
import type { Session } from '../../domain/types';
import { colors, radius, spacing } from '../../theme/tokens';

export default function HistoryScreen() {
  const bikes = useBikes();
  const activeBikeId = useActiveBikeId();
  const [bikeId, setBikeId] = useState<string | null>(null);
  const selectedBikeId = bikeId ?? activeBikeId ?? bikes[0]?.id;
  const sessions = useSessionsForBike(selectedBikeId);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-2)));

  return (
    <Screen>
      <AppText variant="display">History</AppText>

      {bikes.length > 1 ? (
        <ChipGroup
          options={bikes.map((b) => ({ value: b.id, label: bikeLabel(b) }))}
          value={selectedBikeId ?? null}
          onChange={(v) => {
            if (v) {
              setBikeId(v);
              setSelected([]);
            }
          }}
        />
      ) : null}

      {sessions.length >= 2 ? (
        <AppText variant="caption" tone="secondary">
          Tap the circles to pick two sessions to compare.
        </AppText>
      ) : null}

      {sessions.length === 0 ? (
        <EmptyState title="No sessions yet" body="Sessions you log for this bike will appear here." />
      ) : (
        sessions.map((s) => (
          <SessionRow
            key={s.id}
            session={s}
            selected={selected.includes(s.id)}
            selectable={sessions.length >= 2}
            onToggle={() => toggle(s.id)}
          />
        ))
      )}

      {selected.length === 2 ? (
        <Button
          label="Compare selected"
          icon="git-compare-outline"
          size="large"
          onPress={() => {
            // Older session on the left (A), newer on the right (B).
            const [a, b] = sessions.filter((s) => selected.includes(s.id)).reverse();
            if (a && b) router.push({ pathname: '/session/compare', params: { a: a.id, b: b.id } });
          }}
        />
      ) : null}
    </Screen>
  );
}

function SessionRow({
  session,
  selected,
  selectable,
  onToggle,
}: {
  session: Session;
  selected: boolean;
  selectable: boolean;
  onToggle: () => void;
}) {
  const c = session.conditions;
  return (
    <View style={[styles.row, selected && styles.rowSelected]}>
      {selectable ? (
        <Pressable
          onPress={onToggle}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selected }}
          accessibilityLabel={`Select ${session.trackName} on ${session.date} for comparison`}
          style={styles.check}
        >
          <Ionicons
            name={selected ? 'checkmark-circle' : 'ellipse-outline'}
            size={30}
            color={selected ? colors.accent : colors.textMuted}
          />
        </Pressable>
      ) : null}
      <Pressable
        style={styles.body}
        onPress={() => router.push(`/session/${session.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Open session at ${session.trackName} on ${session.date}`}
      >
        <Row style={{ justifyContent: 'space-between' }}>
          <AppText variant="heading" style={{ flex: 1 }} numberOfLines={1}>
            {session.trackName || 'Untitled track'}
          </AppText>
          {session.status === 'active' ? (
            <AppText variant="label" tone="accent">
              Live
            </AppText>
          ) : null}
        </Row>
        <AppText variant="caption" tone="secondary">
          {session.date} · {[labelFor(DIRT_TYPES, c.dirtType), labelFor(MOISTURE_LEVELS, c.moisture)].filter((x) => x !== '—').join(' · ') || 'No conditions'}
        </AppText>
        <Row>
          <AppText variant="valueSmall" tone="accent">
            {session.feedback.ratings.overall ?? '—'}
          </AppText>
          <AppText variant="caption" tone="secondary">
            overall
          </AppText>
          <AppText variant="valueSmall">{session.adjustments.length}</AppText>
          <AppText variant="caption" tone="secondary">
            adjustments
          </AppText>
        </Row>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingRight: spacing.lg,
  },
  rowSelected: { borderColor: colors.accent, backgroundColor: colors.surface2 },
  check: { width: 60, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, paddingVertical: spacing.lg, paddingLeft: spacing.lg, gap: spacing.xs },
});
