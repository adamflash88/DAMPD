import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { IllustrativeBadge } from '../../../components/IllustrativeBadge';
import { ChipGroup, CommitTextField, TextField } from '../../../components/Inputs';
import { Card, Divider, EmptyState, Row, Screen, SectionHeader } from '../../../components/Layout';
import { SettingEditor } from '../../../components/Suspension';
import { bikeRepository, useBike } from '../../../data';
import { clickerConventionLabel, settingDefsFor } from '../../../domain/settings';
import { bikeLabel, confirmAll, countUnverifiedInEnd, withHardware, withModifications } from '../../../domain/setup';
import type { Bike, Spec, SuspensionEndId, SuspensionSetup } from '../../../domain/types';
import { colors, radius, spacing, touch } from '../../../theme/tokens';

const END_OPTIONS = [
  { value: 'fork', label: 'Fork' },
  { value: 'shock', label: 'Shock' },
] as const;

export default function SuspensionProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bike = useBike(id);
  const [end, setEnd] = useState<SuspensionEndId>('fork');

  if (!bike) {
    return (
      <Screen edges={['bottom']}>
        <EmptyState title="Bike not found" />
      </Screen>
    );
  }

  const save = (setup: SuspensionSetup) => void bikeRepository.updateSuspension(bike.id, setup);
  const setup = bike.suspension;
  const unverifiedInEnd = countUnverifiedInEnd(setup, end);

  return (
    <Screen edges={['bottom']}>
      <View>
        <AppText variant="title">{bikeLabel(bike)}</AppText>
        <AppText variant="caption" tone="secondary">
          {clickerConventionLabel(bike.units)} · edits apply to future sessions only
        </AppText>
      </View>

      <ChipGroup options={END_OPTIONS} value={end} onChange={(v) => v && setEnd(v)} />

      {unverifiedInEnd > 0 ? (
        <Card level={2} style={styles.notice}>
          <Row>
            <IllustrativeBadge compact />
            <AppText variant="caption" tone="secondary" style={{ flex: 1 }}>
              {unverifiedInEnd} {end} value{unverifiedInEnd === 1 ? ' is' : 's are'} illustrative seed data, not a
              verified spec. Edit a value or tap its badge to confirm it.
            </AppText>
          </Row>
          <Button
            label={`I've checked these: confirm all ${end} values`}
            variant="secondary"
            onPress={() => save(confirmAll(setup, end))}
          />
        </Card>
      ) : null}

      <SectionHeader title="Hardware" />
      <Card>
        <HardwareField
          label="Make"
          spec={setup[end].make}
          onCommit={(spec) => save(withHardware(setup, end, 'make', spec))}
        />
        <HardwareField
          label="Model"
          spec={setup[end].model}
          onCommit={(spec) => save(withHardware(setup, end, 'model', spec))}
        />
      </Card>

      <SectionHeader title="Modifications" />
      <ModificationsEditor
        items={setup[end].modifications}
        onChange={(mods) => save(withModifications(setup, end, mods))}
      />

      <SectionHeader title="Settings" />
      <Card>
        {settingDefsFor(end).map((def, i) => (
          <View key={def.key}>
            {i > 0 ? <Divider /> : null}
            <SettingEditor setup={setup} settingKey={def.key} units={bike.units} onChange={save} />
          </View>
        ))}
      </Card>
      <UnitsNote bike={bike} />
    </Screen>
  );
}

function HardwareField({
  label,
  spec,
  onCommit,
}: {
  label: string;
  spec: Spec<string>;
  onCommit: (spec: Spec<string>) => void;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <CommitTextField
        label={label}
        value={spec.value ?? ''}
        onCommit={(text) => {
          const value = text.trim() || null;
          if (value !== spec.value) onCommit({ value, isVerified: true });
        }}
      />
      {!spec.isVerified ? <IllustrativeBadge onConfirm={() => onCommit({ ...spec, isVerified: true })} /> : null}
    </View>
  );
}

function ModificationsEditor({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft('');
  };
  return (
    <Card>
      {items.length === 0 ? (
        <AppText tone="muted">No modifications recorded.</AppText>
      ) : (
        items.map((item, i) => (
          <Row key={`${item}-${i}`} style={styles.modRow}>
            <AppText style={{ flex: 1 }}>{item}</AppText>
            <Pressable
              onPress={() => onChange(items.filter((_, j) => j !== i))}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item}`}
              hitSlop={8}
              style={styles.iconButton}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </Row>
        ))
      )}
      <Row>
        <View style={{ flex: 1 }}>
          <TextField
            value={draft}
            onChangeText={setDraft}
            placeholder="e.g. Revalved, stiffer springs"
            onSubmitEditing={add}
            returnKeyType="done"
          />
        </View>
        <Button label="Add" icon="add" variant="secondary" onPress={add} disabled={!draft.trim()} />
      </Row>
    </Card>
  );
}

function UnitsNote({ bike }: { bike: Bike }) {
  return (
    <AppText variant="caption" tone="muted">
      Units: sag {bike.units.sag}, spring rate {bike.units.springRate}, oil level {bike.units.oilLevel}. Change them
      under Garage → Edit.
    </AppText>
  );
}

const styles = StyleSheet.create({
  notice: { gap: spacing.md },
  modRow: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingLeft: spacing.lg,
    minHeight: touch.min,
  },
  iconButton: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' },
});
