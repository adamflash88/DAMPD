import { useState } from 'react';
import { View } from 'react-native';

import { Card, ChipGroup, CommitTextField, NumberInput, Screen, Section, Segmented, Text } from '../components/ui';
import { riderRepository, useRider } from '../data';
import { SKILL_LEVELS } from '../domain/labels';
import { formatNumber } from '../domain/units';
import { spacing } from '../theme/tokens';

const LB_PER_KG = 2.20462;

export default function RiderProfileScreen() {
  const rider = useRider();
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const shown = rider.weightKg === null ? null : weightUnit === 'lb' ? rider.weightKg * LB_PER_KG : rider.weightKg;

  return (
    <Screen>
      <Text variant="subhead" tone="secondary">
        Optional. Rider details give context to your setups and future diagnostics. Stored only on this device.
      </Text>
      <Card>
        <CommitTextField label="Name" value={rider.name} onCommit={(name) => void riderRepository.update({ name: name.trim() })} placeholder="Your name" />
        <View style={{ gap: spacing.xs + 2 }}>
          <Text variant="caption" tone="secondary">
            Weight with riding gear
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <NumberInput
              value={shown}
              width={120}
              unit={weightUnit}
              format={(n) => formatNumber(n, 0)}
              accessibilityLabel={`Weight in ${weightUnit}`}
              validate={(n) => ((weightUnit === 'lb' ? n / LB_PER_KG : n) < 20 || (weightUnit === 'lb' ? n / LB_PER_KG : n) > 250 ? 'Enter a realistic weight' : null)}
              onCommit={(n) => void riderRepository.update({ weightKg: n === null ? null : weightUnit === 'lb' ? n / LB_PER_KG : n })}
            />
            <View style={{ flex: 1 }}>
              <Segmented
                accessibilityLabel="Weight unit"
                options={[
                  { value: 'kg', label: 'kg' },
                  { value: 'lb', label: 'lb' },
                ]}
                value={weightUnit}
                onChange={setWeightUnit}
              />
            </View>
          </View>
        </View>
        <ChipGroup label="Skill level" options={SKILL_LEVELS} value={rider.skill} onChange={(skill) => void riderRepository.update({ skill })} />
      </Card>
      <Section title="Notes">
        <Card>
          <CommitTextField
            value={rider.notes}
            onCommit={(notes) => void riderRepository.update({ notes })}
            multiline
            placeholder="Riding style, injuries, preferences…"
            accessibilityLabel="Rider notes"
          />
        </Card>
      </Section>
    </Screen>
  );
}
