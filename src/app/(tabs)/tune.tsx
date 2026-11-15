import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, ChipGroup, DateField, EmptyState, ListGroup, ListRow, Screen, ScreenHeader, Section, Text, TextField } from '../../components/ui';
import { sessionRepository, useActiveBike, useActiveSessions, useBikes, useRecentTracks } from '../../data';
import { todayISODate } from '../../domain/ids';
import { formatDuration, sessionTitle, summarizeSession } from '../../domain/session';
import { bikeName } from '../../domain/setup';
import { useNow } from '../../hooks/useNow';
import { colors } from '../../theme/tokens';

export default function TuneScreen() {
  const bike = useActiveBike();
  const bikes = useBikes();
  const activeSessions = useActiveSessions();
  const recentTracks = useRecentTracks();
  const now = useNow(activeSessions.length ? 30_000 : null);
  const [track, setTrack] = useState('');
  const [date, setDate] = useState(todayISODate());

  const current = activeSessions.find((s) => s.bikeId === bike?.id) ?? activeSessions[0];

  if (!bike) {
    return (
      <Screen kind="tab">
        <ScreenHeader title="Tune" />
        <EmptyState title="No motorcycle selected" body="Add a motorcycle to start a tuning session." action={<Button label="Add motorcycle" onPress={() => router.push('/bike/new')} />} />
      </Screen>
    );
  }

  if (current) {
    const sum = summarizeSession(current);
    const currentBike = bikes.find((b) => b.id === current.bikeId);
    return (
      <Screen kind="tab">
        <ScreenHeader title="Tune" subtitle="Session in progress" />
        <Card variant="accent">
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text variant="overline" tone="accent">
              Live · {formatDuration(current.startedAt, now)}
            </Text>
          </View>
          <Text variant="title">{sessionTitle(current)}</Text>
          <Text variant="subhead" tone="secondary">
            {currentBike ? bikeName(currentBike) : current.snapshot.bikeLabel} · {sum.testRuns} run{sum.testRuns === 1 ? '' : 's'} · {sum.adjustments} change{sum.adjustments === 1 ? '' : 's'}
          </Text>
          <Button label="CONTINUE SESSION" size="lg" icon="play" onPress={() => router.push(`/session/${current.id}`)} />
        </Card>
        {activeSessions.length > 1 ? (
          <Section title="Other open sessions">
            <ListGroup>
              {activeSessions
                .filter((s) => s.id !== current.id)
                .map((s) => (
                  <ListRow key={s.id} title={sessionTitle(s)} subtitle={s.snapshot.bikeLabel} onPress={() => router.push(`/session/${s.id}`)} />
                ))}
            </ListGroup>
          </Section>
        ) : null}
      </Screen>
    );
  }

  const start = async () => {
    const s = await sessionRepository.start(bike.id, { trackName: track, date });
    setTrack('');
    setDate(todayISODate());
    router.push(`/session/${s.id}`);
  };

  return (
    <Screen kind="tab" footer={<Button label="START SESSION" size="lg" icon="flag" onPress={start} />}>
      <ScreenHeader title="Tune" subtitle="Start a trackside session" />

      <ListGroup>
        <ListRow
          icon="bicycle-outline"
          title={bikeName(bike)}
          subtitle={bike.nickname || 'Motorcycle'}
          value={bikes.length > 1 ? 'Change' : undefined}
          valueTone="accent"
          onPress={bikes.length > 1 ? () => router.push('/bike/switch') : undefined}
        />
      </ListGroup>

      <Card>
        <TextField label="Track (optional)" value={track} onChangeText={setTrack} placeholder="e.g. Glen Helen" autoCapitalize="words" returnKeyType="done" />
        {recentTracks.length > 0 ? (
          <ChipGroup
            scroll
            options={recentTracks.map((t) => ({ value: t, label: t }))}
            value={recentTracks.includes(track) ? track : null}
            onChange={(t) => setTrack(t ?? '')}
          />
        ) : null}
        <DateField label="Date" value={date} onChange={setDate} />
      </Card>

      <Text variant="caption" tone="tertiary">
        Starting saves a snapshot of your current setup. Track conditions, feedback and changes can be added once you&apos;re riding.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
});
