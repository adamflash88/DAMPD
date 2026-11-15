import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, ChipGroup, EmptyState, NumberInput, Screen, Text, TextField } from '../../../components/ui';
import { sessionRepository, useSession } from '../../../data';
import { DIRT_TYPES, MOISTURE_LEVELS, ROUGHNESS_LEVELS, RUT_LEVELS } from '../../../domain/labels';
import type { Session, TrackConditions } from '../../../domain/types';
import { formatNumber, fromDisplay, toDisplay, unitSymbol } from '../../../domain/units';
import { spacing } from '../../../theme/tokens';

export default function ConditionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession(id);
  if (!session) {
    return (
      <Screen>
        <EmptyState title="Session not found" />
      </Screen>
    );
  }
  return <ConditionsForm session={session} />;
}

function ConditionsForm({ session }: { session: Session }) {
  const units = session.snapshot.units;
  const [c, setC] = useState<TrackConditions>(session.conditions);
  const set = (p: Partial<TrackConditions>) => setC((x) => ({ ...x, ...p }));
  const dirty = JSON.stringify(c) !== JSON.stringify(session.conditions);

  return (
    <Screen
      footer={
        <Button
          label="Save conditions"
          size="lg"
          disabled={!dirty}
          onPress={async () => {
            await sessionRepository.updateConditions(session.id, c);
            router.back();
          }}
        />
      }
    >
      <Text variant="subhead" tone="secondary">
        Update any time conditions change. Each update is kept in the session timeline.
      </Text>
      <Card>
        <ChipGroup label="Dirt" options={DIRT_TYPES} value={c.dirtType} onChange={(dirtType) => set({ dirtType })} />
        <ChipGroup label="Moisture" options={MOISTURE_LEVELS} value={c.moisture} onChange={(moisture) => set({ moisture })} />
        <ChipGroup label="Ruts" options={RUT_LEVELS} value={c.ruts} onChange={(ruts) => set({ ruts })} />
        <ChipGroup label="Roughness" options={ROUGHNESS_LEVELS} value={c.roughness} onChange={(roughness) => set({ roughness })} />
        <View style={{ gap: spacing.xs + 2 }}>
          <Text variant="caption" tone="secondary">
            Air temperature
          </Text>
          <NumberInput
            value={c.temperatureC === null ? null : toDisplay('temperature', c.temperatureC, units)}
            unit={unitSymbol('temperature', units)}
            width={120}
            allowNegative
            format={(n) => formatNumber(n, 0)}
            accessibilityLabel={`Air temperature in ${unitSymbol('temperature', units)}`}
            validate={(n) => {
              const cel = fromDisplay('temperature', n, units);
              return cel < -30 || cel > 55 ? 'That temperature looks off' : null;
            }}
            onCommit={(n) => set({ temperatureC: n === null ? null : fromDisplay('temperature', n, units) })}
          />
        </View>
        <TextField label="Notes" value={c.notes} onChangeText={(notes) => set({ notes })} multiline placeholder="e.g. Watered at noon, braking bumps into turn 3" />
      </Card>
    </Screen>
  );
}
