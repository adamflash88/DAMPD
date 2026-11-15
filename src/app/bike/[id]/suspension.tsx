import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AdjusterRow, MeasurementRow } from '../../../components/suspension/SettingControls';
import {
  Button,
  Card,
  Collapsible,
  CommitTextField,
  Divider,
  EmptyState,
  ListGroup,
  ListRow,
  Notice,
  Screen,
  Section,
  Segmented,
  SourceMark,
  Text,
  TextField,
  TextLink,
} from '../../../components/ui';
import { bikeRepository, useBike } from '../../../data';
import { applicableMeasurements, adjusterPath, measurementPath, type MeasurementGroup } from '../../../domain/settings';
import {
  bikeName,
  confirmDemoValues,
  countBySource,
  withHardware,
  withModificationAdded,
  withModificationRemoved,
  withSettingValue,
  withSpringType,
} from '../../../domain/setup';
import type { Bike, SuspensionEnd, SuspensionSetup } from '../../../domain/types';
import { colors, layout, spacing, touch } from '../../../theme/tokens';

const ENDS = [
  { value: 'fork', label: 'Fork' },
  { value: 'shock', label: 'Shock' },
] as const;

export default function SuspensionProfileScreen() {
  const { id, end: endParam } = useLocalSearchParams<{ id: string; end?: string }>();
  const bike = useBike(id);
  const [end, setEnd] = useState<SuspensionEnd>(endParam === 'shock' ? 'shock' : 'fork');

  if (!bike) {
    return (
      <Screen>
        <EmptyState title="Motorcycle not found" />
      </Screen>
    );
  }
  return <Profile bike={bike} end={end} setEnd={setEnd} />;
}

function Profile({ bike, end, setEnd }: { bike: Bike; end: SuspensionEnd; setEnd: (e: SuspensionEnd) => void }) {
  const setup = bike.suspension;
  const save = (next: SuspensionSetup) => void bikeRepository.updateSuspension(bike.id, next);
  const counts = countBySource(setup);
  const e = setup[end];
  const groupRows = (groups: MeasurementGroup[]) =>
    applicableMeasurements(setup, end)
      .filter((d) => groups.includes(d.group))
      .map((d) => (
        <MeasurementRow
          key={d.key}
          def={d}
          units={bike.units}
          value={(e.measurements as unknown as Record<string, { value: number | null; source: never }>)[d.key]!}
          onChange={(v) => save(withSettingValue(setup, measurementPath(end, d.key), v))}
        />
      ));

  const confirmDemo = () =>
    Alert.alert(
      `Keep ${counts.demo} demo values as your settings?`,
      'Only do this if you have checked them against your own bike. They will be recorded as entered by you. They will NOT be marked as manufacturer-verified.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Keep as mine', onPress: () => save(confirmDemoValues(setup)) },
      ],
    );

  const primaryGroups: MeasurementGroup[] = end === 'fork' ? ['geometry', 'sag'] : ['sag'];
  const advancedGroups: MeasurementGroup[] = end === 'fork' ? ['spring', 'oil'] : ['spring'];

  return (
    <Screen>
      <View style={styles.top}>
        <Text variant="subhead" tone="secondary" numberOfLines={1}>
          {bikeName(bike)}
        </Text>
        <Segmented options={ENDS} value={end} onChange={setEnd} accessibilityLabel="Suspension end" />
      </View>

      {counts.demo > 0 ? (
        <Notice
          title={`${counts.demo} demo values in use`}
          body="Amber-dotted values are demonstration placeholders, not specifications. Edit any value to replace it with yours."
          action={<TextLink label="I've checked them, keep as mine" onPress={confirmDemo} />}
        />
      ) : null}

      <Section
        title="Adjustments"
        action={<TextLink label="Manage" onPress={() => router.push({ pathname: '/bike/[id]/adjusters', params: { id: bike.id, end } })} />}
      >
        {e.adjusters.length === 0 ? (
          <EmptyState
            title="No adjusters"
            body={`Add the adjusters your ${end} actually has.`}
            action={<Button label="Add adjuster" size="sm" variant="secondary" onPress={() => router.push({ pathname: '/bike/[id]/adjusters', params: { id: bike.id, end } })} />}
          />
        ) : (
          <ListGroup>
            {e.adjusters.map((a) => (
              <AdjusterRow key={a.id} adjuster={a} onChange={(v) => save(withSettingValue(setup, adjusterPath(end, a.id), v))} />
            ))}
          </ListGroup>
        )}
      </Section>

      <Section title={end === 'fork' ? 'Geometry & sag' : 'Sag'}>
        <ListGroup>{groupRows(primaryGroups)}</ListGroup>
      </Section>

      <Card padded={false}>
        <Collapsible title="Hardware" summary={[e.hardware.make.value, e.hardware.model.value].filter(Boolean).join(' ') || 'Not set'}>
          <HardwareField label="Make" value={e.hardware.make} onCommit={(t) => save(withHardware(setup, end, 'make', t))} />
          <HardwareField label="Model" value={e.hardware.model} onCommit={(t) => save(withHardware(setup, end, 'model', t))} />
          {end === 'fork' ? (
            <View style={styles.field}>
              <Text variant="caption" tone="secondary">
                Spring type
              </Text>
              <Segmented
                accessibilityLabel="Fork spring type"
                options={[
                  { value: 'coil', label: 'Coil' },
                  { value: 'air', label: 'Air' },
                ]}
                value={setup.fork.springType}
                onChange={(t) => save(withSpringType(setup, t))}
              />
            </View>
          ) : null}
        </Collapsible>
        <Divider />
        <Collapsible title="Modifications" summary={e.modifications.length ? `${e.modifications.length}` : 'None'}>
          <Modifications
            items={e.modifications}
            onAdd={(t) => save(withModificationAdded(setup, end, t))}
            onRemove={(mid) => save(withModificationRemoved(setup, end, mid))}
          />
        </Collapsible>
        <Divider />
        <Collapsible title="Advanced specifications" summary={end === 'fork' ? 'Spring, oil' : 'Spring'}>
          <View style={styles.bleed}>
            {groupRows(advancedGroups)}
            <ListRow
              icon="options-outline"
              title="Adjuster types & ranges"
              subtitle="Clicks or turns, counting direction, total range"
              onPress={() => router.push({ pathname: '/bike/[id]/adjusters', params: { id: bike.id, end } })}
            />
          </View>
        </Collapsible>
      </Card>

      <Text variant="caption" tone="tertiary" align="center">
        Changes here apply to future sessions. Past sessions keep the setup they started with.
      </Text>
    </Screen>
  );
}

function HardwareField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: { value: string | null; source: 'manufacturer' | 'user' | 'demo' | 'unknown' };
  onCommit: (t: string) => void;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.inlineLabel}>
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
        <SourceMark source={value.value === null ? 'unknown' : value.source} />
      </View>
      <CommitTextField value={value.value ?? ''} onCommit={onCommit} placeholder={`${label} (optional)`} accessibilityLabel={label} />
    </View>
  );
}

function Modifications({
  items,
  onAdd,
  onRemove,
}: {
  items: { id: string; description: string }[];
  onAdd: (t: string) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft('');
  };
  return (
    <View style={styles.mods}>
      {items.map((m) => (
        <View key={m.id} style={styles.modRow}>
          <Text variant="body" style={styles.flex}>
            {m.description}
          </Text>
          <Pressable
            onPress={() =>
              Alert.alert('Remove modification?', m.description, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => onRemove(m.id) },
              ])
            }
            accessibilityRole="button"
            accessibilityLabel={`Remove ${m.description}`}
            hitSlop={6}
            style={styles.iconBtn}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
      ))}
      <View style={styles.inline}>
        <View style={styles.flex}>
          <TextField value={draft} onChangeText={setDraft} placeholder="e.g. Revalved mid-valve" returnKeyType="done" onSubmitEditing={add} accessibilityLabel="New modification" />
        </View>
        <Button label="Add" size="md" variant="secondary" disabled={!draft.trim()} onPress={add} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { gap: spacing.sm },
  field: { gap: spacing.xs + 2, paddingTop: spacing.xs },
  inlineLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bleed: { marginHorizontal: -layout.cardPadding },
  mods: { gap: spacing.sm },
  modRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: touch.min },
  iconBtn: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
