import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { ConditionsEditor } from '../../components/ConditionsEditor';
import { DateField } from '../../components/DateField';
import { TextField } from '../../components/Inputs';
import { Card, EmptyState, Screen, SectionHeader } from '../../components/Layout';
import { EMPTY_CONDITIONS } from '../../domain/factories';
import { todayISODate } from '../../domain/ids';
import { bikeLabel, countUnverified } from '../../domain/setup';
import type { TrackConditions } from '../../domain/types';
import { sessionRepository, useActiveBike, useActiveSessionForBike, useSessionsForBike } from '../../data';

export default function SessionTab() {
  const bike = useActiveBike();
  const active = useActiveSessionForBike(bike?.id);
  const previous = useSessionsForBike(bike?.id)[0];

  const [trackName, setTrackName] = useState('');
  const [date, setDate] = useState(todayISODate());
  const [conditions, setConditions] = useState<TrackConditions>(EMPTY_CONDITIONS);

  if (!bike) {
    return (
      <Screen>
        <AppText variant="display">Session</AppText>
        <EmptyState
          title="No active bike"
          body="Pick or add a bike in the Garage first."
          action={<Button label="Go to Garage" onPress={() => router.push('/garage')} />}
        />
      </Screen>
    );
  }

  if (active) {
    return (
      <Screen>
        <AppText variant="display">Session</AppText>
        <Card level={2} highlight>
          <AppText variant="label" tone="accent">
            In progress
          </AppText>
          <AppText variant="title">{active.trackName || 'Untitled track'}</AppText>
          <AppText tone="secondary">
            {active.date} · {active.adjustments.length} adjustment{active.adjustments.length === 1 ? '' : 's'}
          </AppText>
          <Button label="Continue session" size="large" icon="flag" onPress={() => router.push(`/session/${active.id}`)} />
        </Card>
      </Screen>
    );
  }

  const unverified = countUnverified(bike.suspension);

  const start = async () => {
    const session = await sessionRepository.start(bike.id, { trackName, date, conditions });
    setTrackName('');
    setConditions(EMPTY_CONDITIONS);
    router.push(`/session/${session.id}`);
  };

  return (
    <Screen>
      <View>
        <AppText variant="display">New session</AppText>
        <AppText tone="secondary">{bikeLabel(bike)}</AppText>
      </View>

      <Card>
        <TextField
          label="Track"
          value={trackName}
          onChangeText={setTrackName}
          placeholder={previous?.trackName || 'Track name'}
          autoCapitalize="words"
        />
        {previous?.trackName && !trackName ? (
          <Button label={`Use "${previous.trackName}"`} variant="ghost" onPress={() => setTrackName(previous.trackName)} />
        ) : null}
        <DateField label="Date" value={date} onChange={setDate} />
      </Card>

      <SectionHeader title="Conditions" />
      <Card>
        <ConditionsEditor
          value={conditions}
          temperatureUnit={bike.units.temperature}
          onChange={(patch) => setConditions((c) => ({ ...c, ...patch }))}
        />
      </Card>

      <AppText variant="caption" tone="secondary">
        {"Starting a session snapshots the bike's full suspension setup as it is right now. Later profile edits won't change this session."}
        {unverified > 0 ? ` ${unverified} illustrative value${unverified === 1 ? '' : 's'} will be snapshotted as-is.` : ''}
      </AppText>
      <Button label="Start session" size="large" icon="flag" onPress={start} disabled={!trackName.trim()} />
    </Screen>
  );
}
