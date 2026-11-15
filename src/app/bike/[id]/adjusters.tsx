import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Card, ChipGroup, EmptyState, NumberInput, Screen, Section, Segmented, SourceMark, Text, TextField } from '../../../components/ui';
import { bikeRepository, useBike } from '../../../data';
import { createAdjuster } from '../../../domain/factories';
import { ADJUSTER_META, formatAdjusterNumber, STANDARD_ADJUSTER_KINDS } from '../../../domain/settings';
import { userValue, withAdjuster, withoutAdjuster } from '../../../domain/setup';
import type { Adjuster, AdjusterKind, Bike, SuspensionEnd } from '../../../domain/types';
import { spacing } from '../../../theme/tokens';

export default function AdjustersScreen() {
  const { id, end } = useLocalSearchParams<{ id: string; end?: string }>();
  const bike = useBike(id);
  if (!bike) {
    return (
      <Screen>
        <EmptyState title="Motorcycle not found" />
      </Screen>
    );
  }
  return <Manager bike={bike} end={end === 'shock' ? 'shock' : 'fork'} />;
}

function Manager({ bike, end }: { bike: Bike; end: SuspensionEnd }) {
  const setup = bike.suspension;
  const adjusters = setup[end].adjusters;
  const update = (a: Adjuster) => void bikeRepository.updateSuspension(bike.id, withAdjuster(setup, end, a));
  const missing = STANDARD_ADJUSTER_KINDS.filter((k) => !adjusters.some((a) => a.kind === k));
  const [customName, setCustomName] = useState('');

  const add = (kind: AdjusterKind, label?: string) =>
    void bikeRepository.updateSuspension(bike.id, withAdjuster(setup, end, createAdjuster({ kind, label })));

  return (
    <Screen>
      <Text variant="subhead" tone="secondary">
        List only the adjusters your {end} actually has. Past sessions keep their own copy and are not affected.
      </Text>

      {adjusters.map((a) => (
        <AdjusterEditor
          key={a.id}
          adjuster={a}
          onChange={update}
          onRemove={() =>
            Alert.alert(`Remove ${a.label}?`, 'Its current value and range are removed from the live profile.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => void bikeRepository.updateSuspension(bike.id, withoutAdjuster(setup, end, a.id)) },
            ])
          }
        />
      ))}

      <Section title="Add adjuster">
        <Card>
          {missing.length > 0 ? (
            <View style={styles.wrap}>
              {missing.map((k) => (
                <Button key={k} label={ADJUSTER_META[k].label} size="sm" variant="secondary" icon="add" onPress={() => add(k)} />
              ))}
            </View>
          ) : null}
          <View style={styles.inline}>
            <View style={styles.flex}>
              <TextField value={customName} onChangeText={setCustomName} placeholder="Custom adjuster name" accessibilityLabel="Custom adjuster name" />
            </View>
            <Button
              label="Add"
              variant="secondary"
              disabled={!customName.trim()}
              onPress={() => {
                add('custom', customName.trim());
                setCustomName('');
              }}
            />
          </View>
        </Card>
      </Section>
    </Screen>
  );
}

function AdjusterEditor({ adjuster: a, onChange, onRemove }: { adjuster: Adjuster; onChange: (a: Adjuster) => void; onRemove: () => void }) {
  const setMechanism = (mechanism: Adjuster['mechanism']) => {
    if (mechanism === a.mechanism) return;
    const apply = () =>
      onChange({ ...a, mechanism, step: mechanism === 'turns' ? 0.25 : 1, current: userValue<number>(null), range: userValue<number>(null) });
    if (a.current.value === null && a.range.value === null) return apply();
    Alert.alert(
      `Switch to ${mechanism}?`,
      'Clicks and turns are not interchangeable, so the current value and range will be cleared on the live profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', style: 'destructive', onPress: apply },
      ],
    );
  };

  return (
    <Card>
      <View style={styles.headRow}>
        <Text variant="headline" style={styles.flex}>
          {a.label}
        </Text>
        <Button label="Remove" size="sm" variant="ghost" onPress={onRemove} />
      </View>
      <Segmented
        accessibilityLabel={`${a.label} mechanism`}
        options={[
          { value: 'clicks', label: 'Clicks' },
          { value: 'turns', label: 'Turns' },
        ]}
        value={a.mechanism}
        onChange={setMechanism}
      />
      <Segmented
        accessibilityLabel={`${a.label} counting direction`}
        options={[
          { value: 'outFromFullStiff', label: 'Out from stiff' },
          { value: 'inFromFullSoft', label: 'In from soft' },
        ]}
        value={a.convention}
        onChange={(convention) => onChange({ ...a, convention })}
      />
      {a.mechanism === 'turns' ? (
        <ChipGroup
          label="Step"
          required
          options={[
            { value: '0.25', label: '¼ turn' },
            { value: '0.5', label: '½ turn' },
            { value: '1', label: '1 turn' },
          ]}
          value={String(a.step) as '0.25' | '0.5' | '1'}
          onChange={(v) => v && onChange({ ...a, step: Number(v) })}
        />
      ) : null}
      <View style={styles.headRow}>
        <View style={styles.rangeLabel}>
          <Text variant="body">Total range</Text>
          <SourceMark source={a.range.value === null ? 'unknown' : a.range.source} />
        </View>
        <NumberInput
          value={a.range.value}
          unit={a.mechanism}
          width={120}
          format={(n) => formatAdjusterNumber(a, n)}
          accessibilityLabel={`${a.label} total range in ${a.mechanism}`}
          validate={(n) => (n > 60 ? 'That range looks too large' : null)}
          onCommit={(n) => {
            const range = userValue(n === null ? null : Math.round(n / a.step) * a.step);
            const cur = a.current.value;
            const current = range.value !== null && cur !== null && cur > range.value ? userValue(range.value) : a.current;
            onChange({ ...a, range, current });
          }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, justifyContent: 'space-between' },
  rangeLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
