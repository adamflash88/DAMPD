import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { conditionsSummary, Timeline } from '../../../components/session/Timeline';
import { formatDate } from '../../../components/session/SessionCard';
import { SetupSummary } from '../../../components/suspension/SetupSummary';
import {
  ActionTile,
  Button,
  Card,
  Collapsible,
  CommitTextField,
  DateField,
  Divider,
  EmptyState,
  ListGroup,
  ListRow,
  Metric,
  MetricRow,
  Screen,
  Section,
  Text,
  TextLink,
} from '../../../components/ui';
import { savedSetupRepository, sessionRepository, useBike, useEffectiveSetup, useSession } from '../../../data';
import { describeSetting, formatDelta, formatSetting } from '../../../domain/settings';
import { applyAdjustments, changedPaths } from '../../../domain/setup';
import { formatDuration, sessionTitle, summarizeSession } from '../../../domain/session';
import type { Session } from '../../../domain/types';
import { useNow } from '../../../hooks/useNow';
import { colors, spacing } from '../../../theme/tokens';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession(id);
  if (!session) {
    return (
      <Screen>
        <EmptyState title="Session not found" />
      </Screen>
    );
  }
  return <SessionView session={session} />;
}

function SessionView({ session }: { session: Session }) {
  const bike = useBike(session.bikeId);
  const effective = useEffectiveSetup(session)!;
  const isActive = session.status === 'active';
  const now = useNow(isActive ? 30_000 : null);
  const sum = summarizeSession(session);
  const units = session.snapshot.units;
  const changed = useMemo(() => changedPaths(session.snapshot.setup, effective), [session.snapshot.setup, effective]);

  const lastAdj = sum.lastAdjustment;
  const lastAdjIndex = lastAdj ? session.events.indexOf(lastAdj) : -1;
  const lastAdjDesc = lastAdj ? describeSetting(applyAdjustments(session.snapshot.setup, session.events.slice(0, lastAdjIndex)), lastAdj.path) : undefined;

  const undoLast = () =>
    Alert.alert('Undo last entry?', 'Removes only the most recent entry from this session.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Undo', style: 'destructive', onPress: () => void sessionRepository.undoLastEvent(session.id) },
    ]);

  const end = () =>
    Alert.alert('End session?', sum.untestedAdjustments > 0 ? `${sum.untestedAdjustments} change${sum.untestedAdjustments === 1 ? ' has' : 's have'} not been tested with a run yet. You can reopen the session later.` : 'You can reopen it later from History.', [
      { text: 'Keep riding', style: 'cancel' },
      { text: 'End session', onPress: () => void sessionRepository.end(session.id) },
    ]);

  const saveAs = async (name: string) => {
    if (!bike) return;
    await savedSetupRepository.save(bike.id, { name: name.trim() || defaultName, setup: effective, sourceSessionId: session.id });
    Alert.alert('Setup saved', 'Find it under Saved setups on the motorcycle profile.');
  };
  const defaultName = `${sessionTitle(session)} · ${formatDate(session.date)}`;
  const saveSetup = () => {
    // Alert.prompt is iOS-only; elsewhere save with a default name (rename later).
    if (Platform.OS === 'ios') Alert.prompt('Save this setup', 'Name the setup this session ended on.', (n) => void saveAs(n), 'plain-text', defaultName);
    else void saveAs(defaultName);
  };

  const footer = isActive ? (
    <>
      <View style={styles.actions}>
        <ActionTile label="LOG FEEDBACK" icon="chatbubble-ellipses" onPress={() => router.push(`/session/${session.id}/feedback`)} />
        <ActionTile label="RECORD ADJUSTMENT" icon="options" variant="secondary" onPress={() => router.push(`/session/${session.id}/adjust`)} />
      </View>
      <Button label="END SESSION" variant="ghost" size="sm" block onPress={end} />
    </>
  ) : undefined;

  return (
    <Screen footer={footer}>
      <Stack.Screen options={{ title: isActive ? 'Live session' : 'Session' }} />

      <View style={styles.head}>
        {isActive ? (
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text variant="overline" tone="accent">
              Live · started {new Date(session.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </Text>
          </View>
        ) : (
          <Text variant="overline" tone="tertiary">
            Completed · {formatDate(session.date)}
          </Text>
        )}
        <Text variant="title">{sessionTitle(session)}</Text>
        <Text variant="subhead" tone="secondary">
          {session.snapshot.bikeLabel}
        </Text>
      </View>

      <MetricRow>
        <Metric label={isActive ? 'Duration' : 'Length'} value={formatDuration(session.startedAt, session.endedAt ?? now)} />
        <Metric label="Test runs" value={String(sum.testRuns)} />
        <Metric label="Changes" value={String(sum.adjustments)} tone={sum.adjustments ? 'accent' : 'primary'} />
      </MetricRow>

      {isActive && lastAdj && lastAdjDesc ? (
        <Card variant="raised" style={styles.lastAdj}>
          <Text variant="overline" tone="tertiary">
            Most recent change{sum.untestedAdjustments > 0 ? ' · not yet tested' : ''}
          </Text>
          <Text variant="bodyStrong">
            {lastAdjDesc.end === 'fork' ? 'Fork' : 'Shock'} {lastAdjDesc.label.toLowerCase()}:{' '}
            <Text variant="bodyStrong" tone="accent">
              {formatSetting(lastAdjDesc, lastAdj.after, units)}
            </Text>
          </Text>
          <Text variant="caption" tone="secondary">
            {(() => {
              const d = formatDelta(lastAdjDesc, lastAdj.before, lastAdj.after, units);
              return `${d.text}${d.direction ? ` · ${d.direction}` : ''} from ${formatSetting(lastAdjDesc, lastAdj.before, units)}`;
            })()}
          </Text>
        </Card>
      ) : null}

      <Section
        title={isActive ? 'Current setup' : 'Final setup'}
        action={sum.adjustments > 0 ? <TextLink label="Compare to start" onPress={() => router.push({ pathname: '/compare', params: { a: `start:${session.id}`, b: `end:${session.id}` } })} /> : undefined}
      >
        <Card>
          <SetupSummary setup={effective} units={units} highlight={changed} />
          {changed.size > 0 ? (
            <Text variant="caption" tone="tertiary">
              Lime values changed during this session
            </Text>
          ) : null}
        </Card>
      </Section>

      <ListGroup>
        <ListRow
          icon="partly-sunny-outline"
          title="Track conditions"
          subtitle={conditionsSummary(session.conditions, units) || (isActive ? 'Optional: add dirt, moisture, ruts…' : 'Not recorded')}
          onPress={() => router.push(`/session/${session.id}/conditions`)}
        />
      </ListGroup>

      <Section title="Timeline">
        <Card>
          <Timeline session={session} onUndoLast={isActive && session.events.length > 0 ? undoLast : undefined} />
        </Card>
      </Section>

      <Card padded={false}>
        <Collapsible title="Session details" summary={formatDate(session.date)}>
          <CommitTextField label="Track" value={session.trackName} placeholder="Track name" onCommit={(trackName) => void sessionRepository.updateDetails(session.id, { trackName: trackName.trim() })} />
          <DateField label="Date" value={session.date} onChange={(date) => void sessionRepository.updateDetails(session.id, { date })} />
          <CommitTextField label="Notes" multiline value={session.notes} placeholder="Anything else worth remembering" onCommit={(notes) => void sessionRepository.updateDetails(session.id, { notes })} />
        </Collapsible>
        <Divider />
        <Collapsible title="Starting setup" summary="Snapshot">
          <SetupSummary setup={session.snapshot.setup} units={units} />
          <Text variant="caption" tone="tertiary">
            Captured {new Date(session.snapshot.capturedAt).toLocaleString()}. Garage edits never change it.
          </Text>
        </Collapsible>
        {session.legacyFeedback ? (
          <>
            <Divider />
            <Collapsible title="Ratings (earlier app version)">
              {Object.entries(session.legacyFeedback.ratings).map(([k, v]) => (
                <View key={k} style={styles.kv}>
                  <Text variant="subhead" tone="secondary" style={styles.flex}>
                    {k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}
                  </Text>
                  <Text variant="value">{v === null ? '—' : `${v}/5`}</Text>
                </View>
              ))}
            </Collapsible>
          </>
        ) : null}
      </Card>

      {!isActive ? (
        <View style={styles.doneActions}>
          <Button label="Save final setup" icon="bookmark-outline" variant="secondary" block onPress={saveSetup} />
          <Button label="Reopen session" variant="secondary" block onPress={() => void sessionRepository.reopen(session.id)} />
          <Button
            label="Delete session"
            variant="danger"
            icon="trash-outline"
            block
            onPress={() =>
              Alert.alert('Delete session?', 'This permanently deletes the session and its timeline.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    router.back();
                    await sessionRepository.remove(session.id);
                  },
                },
              ])
            }
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { gap: 2 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  lastAdj: { gap: 3 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  kv: { flexDirection: 'row', alignItems: 'center', minHeight: 32 },
  doneActions: { gap: spacing.sm },
});
