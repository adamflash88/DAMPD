import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AdjusterRow, MeasurementRow } from '../../../components/suspension/SettingControls';
import { Button, Card, ChipGroup, EmptyState, ListGroup, NumberInput, Screen, Section, Segmented, Text, TextField } from '../../../components/ui';
import { sessionRepository, useEffectiveSetup, useSession } from '../../../data';
import { symptomLabel } from '../../../domain/labels';
import { testRunsOf } from '../../../domain/session';
import { applicablePaths, describeSetting, formatAdjusterNumber, formatDelta, formatSetting, type SettingDescriptor } from '../../../domain/settings';
import { effectiveValue } from '../../../domain/setup';
import type { Session, SettingPath, SuspensionEnd, SuspensionSetup } from '../../../domain/types';
import { displayDecimals, formatNumber, fromDisplay, toDisplay, unitSymbol } from '../../../domain/units';
import { colors, spacing } from '../../../theme/tokens';

const ENDS = [
  { value: 'fork', label: 'Fork' },
  { value: 'shock', label: 'Shock' },
] as const;

const GENERIC_REASONS = ['Baseline change', 'Sag check', 'Track got rougher', 'Track dried out', 'Trying an idea'];

export default function AdjustScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession(id);
  const setup = useEffectiveSetup(session);
  if (!session || !setup) {
    return (
      <Screen>
        <EmptyState title="Session not found" />
      </Screen>
    );
  }
  return <AdjustForm session={session} setup={setup} />;
}

function chipLabel(d: SettingDescriptor): string {
  if (d.adjuster && (d.adjuster.kind === 'compression' || d.adjuster.kind === 'rebound')) return d.label;
  return d.adjuster ? d.shortLabel : d.label;
}

function AdjustForm({ session, setup }: { session: Session; setup: SuspensionSetup }) {
  const units = session.snapshot.units;
  const [end, setEnd] = useState<SuspensionEnd>('fork');
  const [path, setPath] = useState<SettingPath | null>(null);
  const [after, setAfter] = useState<number | null>(null);
  const [manualBefore, setManualBefore] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const options = useMemo(
    () =>
      applicablePaths(setup, end)
        .map((p) => describeSetting(setup, p))
        .filter((d): d is SettingDescriptor => !!d),
    [setup, end],
  );
  const d = path ? describeSetting(setup, path) : undefined;
  const derivedBefore = path ? effectiveValue(session.snapshot.setup, session.events, path) : null;
  const before = derivedBefore ?? manualBefore;

  const lastRun = testRunsOf(session).at(-1);
  const reasons = [...new Set([...(lastRun?.symptoms.map(symptomLabel) ?? []), ...GENERIC_REASONS])];

  const pick = (p: SettingPath | null) => {
    setPath(p);
    setManualBefore(null);
    setAfter(p ? effectiveValue(session.snapshot.setup, session.events, p) : null);
  };

  const unchanged = after !== null && before !== null && Math.abs(after - before) < 1e-9;
  const canSave = !!d && after !== null && !unchanged;
  const delta = d && after !== null ? formatDelta(d, before, after, units) : null;

  const save = async () => {
    if (!path || after === null) return;
    try {
      await sessionRepository.addAdjustment(session.id, { path, after, reason, beforeIfUnknown: manualBefore });
      router.back();
    } catch (e) {
      Alert.alert('Can’t record that', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Screen footer={<Button label="Save adjustment" size="lg" icon="checkmark" disabled={!canSave} onPress={save} />}>
      <Section title="1 · Where">
        <Segmented
          options={ENDS}
          value={end}
          onChange={(e) => {
            setEnd(e);
            pick(null);
          }}
          accessibilityLabel="Fork or shock"
        />
      </Section>

      <Section title="2 · What">
        <ChipGroup options={options.map((o) => ({ value: o.path, label: chipLabel(o) }))} value={path} onChange={pick} />
        {options.length === 0 ? (
          <Text variant="caption" tone="tertiary">
            No adjustable settings set up for the {end}.
          </Text>
        ) : null}
      </Section>

      {d ? (
        <Section title="3 · Setting">
          <ListGroup>
            <View style={styles.prevRow}>
              <Text variant="body" tone="secondary" style={styles.flex}>
                Previous
              </Text>
              {derivedBefore !== null ? (
                <Text variant="value">{formatSetting(d, derivedBefore, units)}</Text>
              ) : d.adjuster ? (
                <NumberInput
                  value={manualBefore}
                  width={96}
                  format={(n) => formatAdjusterNumber(d.adjuster!, n)}
                  placeholder="unknown"
                  accessibilityLabel={`Previous ${d.label}, if known`}
                  onCommit={setManualBefore}
                />
              ) : d.measurement ? (
                <NumberInput
                  value={manualBefore === null ? null : toDisplay(d.measurement.quantity, manualBefore, units)}
                  width={112}
                  unit={unitSymbol(d.measurement.quantity, units)}
                  format={(n) => formatNumber(n, displayDecimals(d.measurement!.quantity, units))}
                  placeholder="unknown"
                  accessibilityLabel={`Previous ${d.label}, if known`}
                  onCommit={(n) => setManualBefore(n === null ? null : fromDisplay(d.measurement!.quantity, n, units))}
                />
              ) : null}
            </View>
            {d.adjuster ? (
              <AdjusterRow
                adjuster={d.adjuster}
                label="New"
                value={{ value: after, source: 'user' }}
                highlight={!unchanged && after !== null}
                onChange={setAfter}
              />
            ) : d.measurement ? (
              <MeasurementRow
                def={{ ...d.measurement, label: 'New', hint: d.measurement.hint }}
                value={{ value: after, source: 'user' }}
                units={units}
                highlight={!unchanged && after !== null}
                onChange={setAfter}
              />
            ) : null}
          </ListGroup>

          <Card variant="raised" style={styles.change} accessibilityLiveRegion="polite">
            <Text variant="overline" tone="tertiary">
              {end === 'fork' ? 'Fork' : 'Shock'} {d.label.toLowerCase()}
            </Text>
            <Text variant="metric" tone={unchanged || after === null ? 'secondary' : 'accent'}>
              {after === null ? 'Set a new value' : unchanged ? 'No change yet' : delta?.text}
            </Text>
            {!unchanged && after !== null ? (
              <Text variant="subhead" tone="secondary">
                {formatSetting(d, before, units)} → {formatSetting(d, after, units)}
                {delta?.direction ? ` · ${delta.direction}` : ''}
              </Text>
            ) : null}
          </Card>
        </Section>
      ) : null}

      {d ? (
        <Section title="Reason (optional)">
          <ChipGroup options={reasons.map((r) => ({ value: r, label: r }))} value={reasons.includes(reason) ? reason : null} onChange={(r) => setReason(r ?? '')} />
          <TextField value={reason} onChangeText={setReason} placeholder="Why this change?" accessibilityLabel="Reason for adjustment" />
        </Section>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  prevRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52, paddingHorizontal: 14 },
  change: { gap: 2, borderColor: colors.border },
});
