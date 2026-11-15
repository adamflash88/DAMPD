import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { SessionCard } from '../../components/session/SessionCard';
import { Button, ChipGroup, EmptyState, Screen, ScreenHeader, Text } from '../../components/ui';
import { useActiveBikeId, useBikes, useSessions } from '../../data';
import { bikeName } from '../../domain/setup';
import { spacing } from '../../theme/tokens';

const ALL = '__all__';

export default function HistoryScreen() {
  const bikes = useBikes();
  const activeBikeId = useActiveBikeId();
  const [bikeFilter, setBikeFilter] = useState<string>(activeBikeId ?? ALL);
  const [trackFilter, setTrackFilter] = useState<string>(ALL);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const all = useSessions(bikeFilter === ALL ? null : bikeFilter);
  const tracks = useMemo(() => [...new Set(all.map((s) => s.trackName.trim()).filter(Boolean))].sort(), [all]);
  const sessions = trackFilter === ALL ? all : all.filter((s) => s.trackName.trim() === trackFilter);
  const names = useMemo(() => Object.fromEntries(bikes.map((b) => [b.id, bikeName(b)])), [bikes]);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-2)));
  const compare = () => {
    const [newer, older] = sessions.filter((s) => selected.includes(s.id));
    if (newer && older) router.push({ pathname: '/compare', params: { a: `end:${older.id}`, b: `end:${newer.id}` } });
  };

  return (
    <Screen
      kind="tab"
      footer={
        selecting ? (
          <Button label={selected.length === 2 ? 'COMPARE' : `Select ${2 - selected.length} more`} size="lg" icon="git-compare-outline" disabled={selected.length !== 2} onPress={compare} />
        ) : undefined
      }
    >
      <ScreenHeader
        title="History"
        subtitle={`${sessions.length} session${sessions.length === 1 ? '' : 's'}`}
        right={
          all.length >= 2 ? (
            <Button
              label={selecting ? 'Done' : 'Compare'}
              size="sm"
              variant={selecting ? 'primary' : 'secondary'}
              icon={selecting ? undefined : 'git-compare-outline'}
              onPress={() => {
                setSelecting((x) => !x);
                setSelected([]);
              }}
            />
          ) : undefined
        }
      />

      {bikes.length > 1 || tracks.length > 1 ? (
        <View style={{ gap: spacing.sm }}>
          {bikes.length > 1 ? (
            <ChipGroup
              scroll
              required
              options={[{ value: ALL, label: 'All bikes' }, ...bikes.map((b) => ({ value: b.id, label: b.nickname || `${b.model} ${b.year}` }))]}
              value={bikeFilter}
              onChange={(v) => {
                setBikeFilter(v ?? ALL);
                setTrackFilter(ALL);
                setSelected([]);
              }}
            />
          ) : null}
          {tracks.length > 1 ? (
            <ChipGroup
              scroll
              required
              options={[{ value: ALL, label: 'All tracks' }, ...tracks.map((t) => ({ value: t, label: t }))]}
              value={trackFilter}
              onChange={(v) => setTrackFilter(v ?? ALL)}
            />
          ) : null}
        </View>
      ) : null}

      {selecting ? (
        <Text variant="caption" tone="secondary">
          Pick two sessions to compare their setups and outcomes.
        </Text>
      ) : null}

      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          body="Sessions you log at the track show up here with their changes and results."
          action={<Button label="Start tuning" icon="flag" onPress={() => router.push('/tune')} />}
        />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              bikeName={bikeFilter === ALL ? names[s.bikeId] : undefined}
              selectable={selecting}
              selected={selected.includes(s.id)}
              onToggleSelect={() => toggle(s.id)}
              onPress={() => (selecting ? toggle(s.id) : router.push(`/session/${s.id}`))}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
