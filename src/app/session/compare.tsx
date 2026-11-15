import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Card, EmptyState, Screen, SectionHeader } from '../../components/Layout';
import { useEffectiveSetup, useSession } from '../../data';
import { DIRT_TYPES, labelFor, MOISTURE_LEVELS, RATING_KEYS, RUT_LEVELS } from '../../domain/labels';
import { formatValue, getSettingDef, unitLabel } from '../../domain/settings';
import { diffHardware, diffSettings } from '../../domain/setup';
import type { Session, SuspensionSetup } from '../../domain/types';
import { colors, radius, spacing } from '../../theme/tokens';

/**
 * Side-by-side comparison of two sessions. "Setup" compares the setup each
 * session ENDED on (snapshot + adjustments), since that's what produced the
 * final feedback. Starting snapshots are compared in their own section.
 */
export default function CompareScreen() {
  const params = useLocalSearchParams<{ a: string; b: string }>();
  const a = useSession(params.a);
  const b = useSession(params.b);
  const aEnd = useEffectiveSetup(a);
  const bEnd = useEffectiveSetup(b);

  if (!a || !b || !aEnd || !bEnd) {
    return (
      <Screen edges={['bottom']}>
        <EmptyState title="Pick two sessions to compare" />
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <View style={styles.headerRow}>
        <View style={styles.label} />
        <SessionHead session={a} tag="A" />
        <SessionHead session={b} tag="B" />
      </View>
      {a.snapshot.units.springRate !== b.snapshot.units.springRate || a.snapshot.units.sag !== b.snapshot.units.sag ? (
        <AppText variant="caption" tone="illustrative">
          These sessions were recorded with different units. Numbers are shown as recorded and are not converted.
        </AppText>
      ) : null}

      <SectionHeader title="Outcome" />
      <Card>
        {RATING_KEYS.map((r) => {
          const av = a.feedback.ratings[r.key];
          const bv = b.feedback.ratings[r.key];
          return <CompareRow key={r.key} label={r.label} a={av?.toString() ?? '—'} b={bv?.toString() ?? '—'} changed={av !== bv} numeric />;
        })}
        <CompareRow label="Adjustments" a={String(a.adjustments.length)} b={String(b.adjustments.length)} changed={a.adjustments.length !== b.adjustments.length} numeric />
      </Card>

      <SectionHeader title="Setup at end of session" />
      <SetupCompare a={aEnd} b={bEnd} session={a} />

      <SectionHeader title="Setup at start (snapshot)" />
      <SetupCompare a={a.snapshot.setup} b={b.snapshot.setup} session={a} />

      <SectionHeader title="Conditions" />
      <Card>
        <CompareRow label="Dirt" a={labelFor(DIRT_TYPES, a.conditions.dirtType)} b={labelFor(DIRT_TYPES, b.conditions.dirtType)} changed={a.conditions.dirtType !== b.conditions.dirtType} />
        <CompareRow label="Moisture" a={labelFor(MOISTURE_LEVELS, a.conditions.moisture)} b={labelFor(MOISTURE_LEVELS, b.conditions.moisture)} changed={a.conditions.moisture !== b.conditions.moisture} />
        <CompareRow label="Ruts" a={labelFor(RUT_LEVELS, a.conditions.ruts)} b={labelFor(RUT_LEVELS, b.conditions.ruts)} changed={a.conditions.ruts !== b.conditions.ruts} />
        <CompareRow
          label="Temp"
          a={a.conditions.temperature === null ? '—' : `${a.conditions.temperature}°${a.snapshot.units.temperature}`}
          b={b.conditions.temperature === null ? '—' : `${b.conditions.temperature}°${b.snapshot.units.temperature}`}
          changed={a.conditions.temperature !== b.conditions.temperature}
          numeric
        />
      </Card>

      <SectionHeader title="Notes" />
      <Card>
        <AppText variant="label" tone="secondary">A</AppText>
        <AppText tone={a.feedback.notes ? 'primary' : 'muted'}>{a.feedback.notes || 'No notes'}</AppText>
        <AppText variant="label" tone="secondary">B</AppText>
        <AppText tone={b.feedback.notes ? 'primary' : 'muted'}>{b.feedback.notes || 'No notes'}</AppText>
      </Card>
    </Screen>
  );
}

function SessionHead({ session, tag }: { session: Session; tag: string }) {
  return (
    <View style={styles.col}>
      <AppText variant="label" tone="accent">{tag}</AppText>
      <AppText variant="bodyStrong" numberOfLines={2}>{session.trackName || 'Untitled'}</AppText>
      <AppText variant="caption" tone="secondary">{session.date}</AppText>
    </View>
  );
}

function SetupCompare({ a, b, session }: { a: SuspensionSetup; b: SuspensionSetup; session: Session }) {
  const settings = useMemo(() => diffSettings(a, b), [a, b]);
  const hardware = useMemo(() => diffHardware(a, b), [a, b]);
  const units = session.snapshot.units;
  const changes = settings.filter((s) => s.changed).length + hardware.filter((h) => h.changed).length;

  return (
    <Card>
      <AppText variant="caption" tone={changes ? 'accent' : 'secondary'}>
        {changes ? `${changes} difference${changes === 1 ? '' : 's'} highlighted` : 'No differences'}
      </AppText>
      {(['fork', 'shock'] as const).map((end) => (
        <View key={end} style={{ gap: spacing.xs }}>
          <AppText variant="heading" style={{ marginTop: spacing.sm }}>{end === 'fork' ? 'Fork' : 'Shock'}</AppText>
          {settings
            .filter((s) => getSettingDef(s.key).end === end)
            .map((s) => {
              const def = getSettingDef(s.key);
              const unit = def.kind === 'clicker' ? '' : ` ${unitLabel(def.kind, units)}`;
              return (
                <CompareRow
                  key={s.key}
                  label={def.shortLabel}
                  a={formatValue(s.a, def) + (s.a === null ? '' : unit)}
                  b={formatValue(s.b, def) + (s.b === null ? '' : unit)}
                  changed={s.changed}
                  numeric
                />
              );
            })}
          {hardware
            .filter((h) => h.end === end && (h.a || h.b))
            .map((h) => (
              <CompareRow key={h.label} label={h.label} a={h.a || '—'} b={h.b || '—'} changed={h.changed} />
            ))}
        </View>
      ))}
    </Card>
  );
}

function CompareRow({
  label,
  a,
  b,
  changed,
  numeric,
}: {
  label: string;
  a: string;
  b: string;
  changed: boolean;
  numeric?: boolean;
}) {
  const variant = numeric ? 'valueSmall' : 'body';
  return (
    <View
      style={[styles.row, changed && styles.rowChanged]}
      accessibilityLabel={`${label}: A ${a}, B ${b}${changed ? ', changed' : ''}`}
    >
      <AppText variant="caption" tone="secondary" style={styles.label}>{label}</AppText>
      <AppText variant={variant} tone={changed ? 'accent' : 'primary'} style={styles.col}>{a}</AppText>
      <AppText variant={variant} tone={changed ? 'accent' : 'primary'} style={styles.col}>{b}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  rowChanged: { backgroundColor: colors.accentSubtle },
  label: { width: 96 },
  col: { flex: 1 },
});
