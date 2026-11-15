import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { ConditionsEditor } from '../../../components/ConditionsEditor';
import { DateField } from '../../../components/DateField';
import { CommitTextField, RatingPicker } from '../../../components/Inputs';
import { Card, Divider, EmptyState, Row, Screen, SectionHeader } from '../../../components/Layout';
import { IllustrativeLegend, SetupSummary } from '../../../components/Suspension';
import { sessionRepository, useEffectiveSetup, useSession } from '../../../data';
import { RATING_KEYS } from '../../../domain/labels';
import { formatValue, getSettingDef, unitLabel } from '../../../domain/settings';
import { adjustmentDelta, countUnverified } from '../../../domain/setup';
import type { Adjustment, BikeUnits, SettingKey } from '../../../domain/types';
import { colors, radius, spacing, touch } from '../../../theme/tokens';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession(id);
  const effective = useEffectiveSetup(session);

  const changedKeys = useMemo(
    () => new Set<SettingKey>(session?.adjustments.map((a) => a.setting) ?? []),
    [session?.adjustments],
  );

  if (!session || !effective) {
    return (
      <Screen edges={['bottom']}>
        <EmptyState title="Session not found" />
      </Screen>
    );
  }

  const { units } = session.snapshot;
  const isActive = session.status === 'active';
  const unverified = countUnverified(session.snapshot.setup);

  const confirmDelete = () =>
    Alert.alert('Delete session?', 'This permanently deletes the session and its adjustments.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await sessionRepository.remove(session.id);
          router.back();
        },
      },
    ]);

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: session.trackName || 'Session' }} />

      <Card level={2} highlight={isActive}>
        <AppText variant="label" tone={isActive ? 'accent' : 'secondary'}>
          {isActive ? 'In progress' : 'Completed'}
        </AppText>
        <CommitTextField
          label="Track"
          value={session.trackName}
          onCommit={(trackName) => void sessionRepository.updateDetails(session.id, { trackName: trackName.trim() })}
        />
        <DateField
          label="Date"
          value={session.date}
          onChange={(date) => void sessionRepository.updateDetails(session.id, { date })}
        />
        <AppText variant="caption" tone="muted">
          {session.snapshot.bikeLabel} · setup snapshotted {new Date(session.snapshot.capturedAt).toLocaleString()}
        </AppText>
      </Card>

      <SectionHeader title={`Adjustments (${session.adjustments.length})`} />
      <Card>
        {session.adjustments.length === 0 ? (
          <AppText tone="muted">No changes yet. Log each clicker, spring or sag change as you make it.</AppText>
        ) : (
          session.adjustments.map((adj, i) => (
            <View key={adj.id}>
              {i > 0 ? <Divider /> : null}
              <AdjustmentRow
                adjustment={adj}
                units={units}
                onRemove={() =>
                  Alert.alert('Remove adjustment?', undefined, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: () => void sessionRepository.removeAdjustment(session.id, adj.id),
                    },
                  ])
                }
              />
            </View>
          ))
        )}
        <Button
          label="Log adjustment"
          icon="add"
          size="large"
          onPress={() => router.push(`/session/${session.id}/adjust`)}
        />
      </Card>

      <SectionHeader title="Rider feedback" />
      <Card>
        {RATING_KEYS.map((r) => (
          <RatingPicker
            key={r.key}
            label={r.label}
            hint={r.hint}
            value={session.feedback.ratings[r.key]}
            onChange={(v) =>
              void sessionRepository.updateFeedback(session.id, {
                ...session.feedback,
                ratings: { ...session.feedback.ratings, [r.key]: v },
              })
            }
          />
        ))}
        <CommitTextField
          label="Notes"
          value={session.feedback.notes}
          multiline
          placeholder="What did the bike do? Where on the track?"
          onCommit={(notes) => void sessionRepository.updateFeedback(session.id, { ...session.feedback, notes })}
        />
      </Card>

      <SectionHeader title="Conditions" />
      <Card>
        <ConditionsEditor
          value={session.conditions}
          temperatureUnit={units.temperature}
          onChange={(patch) => void sessionRepository.updateConditions(session.id, patch)}
        />
      </Card>

      <SectionHeader title="Setup at session start (snapshot)" />
      <Card>
        <AppText variant="heading">Fork</AppText>
        <SetupSummary setup={session.snapshot.setup} units={units} end="fork" />
        <AppText variant="heading">Shock</AppText>
        <SetupSummary setup={session.snapshot.setup} units={units} end="shock" />
        {unverified > 0 ? <IllustrativeLegend /> : null}
      </Card>

      {session.adjustments.length > 0 ? (
        <>
          <SectionHeader title="Setup now (after adjustments)" />
          <Card>
            <AppText variant="heading">Fork</AppText>
            <SetupSummary setup={effective} units={units} end="fork" highlightKeys={changedKeys} />
            <AppText variant="heading">Shock</AppText>
            <SetupSummary setup={effective} units={units} end="shock" highlightKeys={changedKeys} />
          </Card>
        </>
      ) : null}

      {isActive ? (
        <Button
          label="Finish session"
          icon="checkmark-done"
          size="large"
          onPress={async () => {
            await sessionRepository.complete(session.id);
            router.back();
          }}
        />
      ) : (
        <Button label="Reopen session" variant="secondary" onPress={() => void sessionRepository.reopen(session.id)} />
      )}
      <Button label="Delete session" variant="danger" icon="trash-outline" onPress={confirmDelete} />
    </Screen>
  );
}

function AdjustmentRow({
  adjustment,
  units,
  onRemove,
}: {
  adjustment: Adjustment;
  units: BikeUnits;
  onRemove: () => void;
}) {
  const def = getSettingDef(adjustment.setting);
  const delta = adjustmentDelta(adjustment);
  const unit = def.kind === 'clicker' ? 'clicks' : unitLabel(def.kind, units);
  const deltaText =
    delta === null ? 'new' : `${delta > 0 ? '+' : ''}${formatValue(delta, def)}${def.kind === 'clicker' ? '' : ` ${unit}`}`;

  return (
    <View style={styles.adjRow}>
      <Row style={{ justifyContent: 'space-between' }}>
        <AppText variant="bodyStrong" style={{ flex: 1 }}>
          {def.end === 'fork' ? 'Fork' : 'Shock'} · {def.label}
        </AppText>
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${def.label} adjustment`}
          style={styles.iconButton}
        >
          <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </Row>
      <Row>
        <AppText variant="value" tone="secondary">
          {formatValue(adjustment.before, def)}
        </AppText>
        <Ionicons name="arrow-forward" size={20} color={colors.textMuted} />
        <AppText variant="value" tone="accent">
          {formatValue(adjustment.after, def)}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {unit}
        </AppText>
        <View style={styles.deltaPill}>
          <AppText variant="caption" tone="accent" style={{ fontVariant: ['tabular-nums'], fontWeight: '700' }}>
            {deltaText}
          </AppText>
        </View>
      </Row>
      {adjustment.reason ? <AppText tone="secondary">{adjustment.reason}</AppText> : null}
      <AppText variant="caption" tone="muted">
        {new Date(adjustment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  adjRow: { gap: spacing.xs, paddingVertical: spacing.sm },
  iconButton: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' },
  deltaPill: {
    marginLeft: 'auto',
    backgroundColor: colors.accentSubtle,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
});
