import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { conditionsSummary } from '../components/session/Timeline';
import { Card, EmptyState, Notice, Screen, Section, Segmented, Text } from '../components/ui';
import { useSetupSource, type SetupSource } from '../data';
import { symptomLabel } from '../domain/labels';
import { formatSetting } from '../domain/settings';
import { diffHardware, diffSettings } from '../domain/setup';
import { summarizeSession, testRunsOf } from '../domain/session';
import type { DisplayUnits, Session } from '../domain/types';
import { colors, layout, radius, spacing } from '../theme/tokens';

export default function CompareScreen() {
  const params = useLocalSearchParams<{ a: string; b: string }>();
  const [which, setWhich] = useState<'end' | 'start'>('end');
  // Two different sessions: let the rider switch between their starting or ending setups.
  // (Start vs end of the SAME session is left exactly as requested.)
  const twoSessions = bothSessions(params) && params.a?.split(':')[1] !== params.b?.split(':')[1];
  const swap = (ref: string | undefined) => (ref && twoSessions ? ref.replace(/^(start|end)/, which) : ref);
  const a = useSetupSource(swap(params.a));
  const b = useSetupSource(swap(params.b));
  const [filter, setFilter] = useState<'changes' | 'all'>('changes');

  if (!a || !b) {
    return (
      <Screen>
        <EmptyState title="Nothing to compare" body="Pick two sessions or saved setups." />
      </Screen>
    );
  }
  return <Comparison a={a} b={b} filter={filter} setFilter={setFilter} which={twoSessions ? which : null} setWhich={setWhich} />;
}

const bothSessions = (p: { a?: string; b?: string }) => !!p.a && !!p.b && /^(start|end):/.test(p.a) && /^(start|end):/.test(p.b);

function Comparison({
  a,
  b,
  filter,
  setFilter,
  which,
  setWhich,
}: {
  a: SetupSource;
  b: SetupSource;
  filter: 'changes' | 'all';
  setFilter: (f: 'changes' | 'all') => void;
  which: 'end' | 'start' | null;
  setWhich: (w: 'end' | 'start') => void;
}) {
  // Values are canonical, so one set of display units is valid for both sides.
  const units: DisplayUnits = b.units;
  const settings = useMemo(() => diffSettings(a.setup, b.setup), [a.setup, b.setup]);
  const hardware = useMemo(() => diffHardware(a.setup, b.setup), [a.setup, b.setup]);
  const changes = settings.filter((s) => s.changed).length + hardware.filter((h) => h.changed).length;

  return (
    <Screen>
      <View style={styles.heads}>
        <Head tag="A" source={a} />
        <Head tag="B" source={b} />
      </View>

      {which ? (
        <Segmented
          accessibilityLabel="Compare starting or ending setups"
          options={[
            { value: 'end', label: 'Ending setups' },
            { value: 'start', label: 'Starting setups' },
          ]}
          value={which}
          onChange={setWhich}
        />
      ) : null}

      <View style={styles.summaryRow}>
        <Text variant="subhead" tone={changes ? 'accent' : 'secondary'} style={styles.flex}>
          {changes ? `${changes} difference${changes === 1 ? '' : 's'}` : 'Identical setups'}
        </Text>
        <View style={styles.filter}>
          <Segmented
            accessibilityLabel="Show changes or all settings"
            options={[
              { value: 'changes', label: 'Changes' },
              { value: 'all', label: 'All' },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </View>
      </View>

      {(['fork', 'shock'] as const).map((end) => {
        const rows = settings.filter((s) => s.descriptor.end === end && (filter === 'all' || s.changed));
        const hw = hardware.filter((h) => h.end === end && (filter === 'all' ? h.a || h.b : h.changed));
        if (rows.length === 0 && hw.length === 0) return null;
        return (
          <Section key={end} title={end === 'fork' ? 'Fork' : 'Shock'}>
            <Card padded={false}>
              {rows.map((r) => (
                <Row
                  key={r.path}
                  label={r.descriptor.shortLabel}
                  a={r.presence === 'bOnly' ? 'n/a' : formatSetting(r.descriptor, r.a, units, true)}
                  b={r.presence === 'aOnly' ? 'n/a' : formatSetting(r.descriptor, r.b, units, true)}
                  changed={r.changed}
                />
              ))}
              {hw.map((h) => (
                <Row key={h.label} label={h.label} a={h.a || '—'} b={h.b || '—'} changed={h.changed} text />
              ))}
            </Card>
          </Section>
        );
      })}

      {a.session && b.session ? <Outcomes a={a.session} b={b.session} units={units} /> : null}

      {a.units.springRate !== b.units.springRate || a.units.length !== b.units.length ? (
        <Notice tone="neutral" title="Shown in B's units" body="These were recorded with different display units. Values are converted, not just relabelled." />
      ) : null}
    </Screen>
  );
}

function Head({ tag, source }: { tag: string; source: SetupSource }) {
  const onPress = source.session ? () => router.push(`/session/${source.session!.id}`) : undefined;
  return (
    <View style={styles.head}>
      <Text variant="overline" tone="accent">
        {tag}
      </Text>
      <Text variant="bodyStrong" numberOfLines={2} onPress={onPress}>
        {source.title}
      </Text>
      <Text variant="caption" tone="secondary" numberOfLines={1}>
        {source.subtitle}
      </Text>
    </View>
  );
}

function Row({ label, a, b, changed, text }: { label: string; a: string; b: string; changed: boolean; text?: boolean }) {
  const variant = text ? 'subhead' : 'value';
  return (
    <View style={[styles.row, changed && styles.rowChanged]} accessible accessibilityLabel={`${label}: A ${a}, B ${b}${changed ? ', changed' : ''}`}>
      <Text variant="caption" tone="secondary" style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <Text variant={variant} tone={changed ? 'secondary' : 'primary'} style={styles.col} numberOfLines={2}>
        {a}
      </Text>
      <Text variant={variant} tone={changed ? 'accent' : 'primary'} style={styles.col} numberOfLines={2}>
        {b}
      </Text>
    </View>
  );
}

function Outcomes({ a, b, units }: { a: Session; b: Session; units: DisplayUnits }) {
  const sa = summarizeSession(a);
  const sb = summarizeSession(b);
  const symptoms = (s: Session) => {
    const last = testRunsOf(s).at(-1);
    return last && last.symptoms.length ? last.symptoms.map((x) => `${symptomLabel(x)} ${x.severity}/5`).join(', ') : 'None reported';
  };
  return (
    <Section title="Outcomes">
      <Card padded={false}>
        <Row label="Test runs" a={String(sa.testRuns)} b={String(sb.testRuns)} changed={sa.testRuns !== sb.testRuns} />
        <Row label="Changes" a={String(sa.adjustments)} b={String(sb.adjustments)} changed={sa.adjustments !== sb.adjustments} />
        <Row label="Better runs" a={String(sa.outcomes.better)} b={String(sb.outcomes.better)} changed={sa.outcomes.better !== sb.outcomes.better} />
        <Row label="Worse runs" a={String(sa.outcomes.worse)} b={String(sb.outcomes.worse)} changed={sa.outcomes.worse !== sb.outcomes.worse} />
        <Row label="Last run symptoms" a={symptoms(a)} b={symptoms(b)} changed={symptoms(a) !== symptoms(b)} text />
        <Row
          label="Conditions"
          a={conditionsSummary(a.conditions, units) || '—'}
          b={conditionsSummary(b.conditions, units) || '—'}
          changed={conditionsSummary(a.conditions, units) !== conditionsSummary(b.conditions, units)}
          text
        />
      </Card>
    </Section>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heads: { flexDirection: 'row', gap: spacing.sm, paddingLeft: 96 + spacing.sm },
  head: { flex: 1, gap: 1 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  filter: { width: 170 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 40,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: layout.cardPadding - 4,
    borderRadius: radius.sm,
  },
  rowChanged: { backgroundColor: colors.accentMuted },
  label: { width: 92 },
  col: { flex: 1 },
});
