import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, ChipGroup, Collapsible, EmptyState, MultiChipGroup, Screen, Section, Segmented, Text, TextField, TextLink } from '../../../components/ui';
import { sessionRepository, useSession } from '../../../data';
import { newId } from '../../../domain/ids';
import { AFFECTED_ENDS, CONFIDENCE_LEVELS, OUTCOMES, SITUATIONS, SYMPTOMS, symptomLabel } from '../../../domain/labels';
import { shouldAskOutcome, summarizeSession, testRunsOf } from '../../../domain/session';
import type { RunOutcome, Session, Severity, SymptomReport, SymptomType } from '../../../domain/types';
import { colors, layout, radius, spacing } from '../../../theme/tokens';

export default function FeedbackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession(id);
  if (!session) {
    return (
      <Screen>
        <EmptyState title="Session not found" />
      </Screen>
    );
  }
  return <FeedbackForm session={session} />;
}

function newReport(symptom: SymptomType): SymptomReport {
  return {
    id: newId(),
    symptom,
    customLabel: '',
    end: SYMPTOMS.find((s) => s.value === symptom)?.defaultEnd ?? 'both',
    severity: 3,
    situations: [],
    confidence: 'medium',
    notes: '',
  };
}

function FeedbackForm({ session }: { session: Session }) {
  const ask = shouldAskOutcome(session);
  const sum = summarizeSession(session);
  const previous = testRunsOf(session).at(-1);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [reports, setReports] = useState<SymptomReport[]>([]);
  const [notes, setNotes] = useState('');
  const runNumber = sum.testRuns + 1;

  const toggle = (symptom: SymptomType) =>
    setReports((rs) => (rs.some((r) => r.symptom === symptom) && symptom !== 'other' ? rs.filter((r) => r.symptom !== symptom) : [...rs, newReport(symptom)]));
  const patch = (rid: string, p: Partial<SymptomReport>) => setReports((rs) => rs.map((r) => (r.id === rid ? { ...r, ...p } : r)));
  const remove = (rid: string) => setReports((rs) => rs.filter((r) => r.id !== rid));

  const invalidOther = reports.some((r) => r.symptom === 'other' && !r.customLabel.trim());

  const save = async () => {
    await sessionRepository.addTestRun(session.id, { outcome: ask ? outcome : null, symptoms: reports, notes });
    router.back();
  };

  return (
    <Screen footer={<Button label={`Save run ${runNumber}`} size="lg" icon="checkmark" disabled={invalidOther} onPress={save} />}>
      <Text variant="subhead" tone="secondary">
        Run {runNumber}
        {sum.untestedAdjustments > 0 ? ` · after ${sum.untestedAdjustments} change${sum.untestedAdjustments === 1 ? '' : 's'}` : ''}
      </Text>

      {ask ? (
        <Section title={previous ? 'Compared with the last run' : 'Compared with how it started'}>
          <Card>
            <Text variant="headline">Did the bike feel better?</Text>
            <ChipGroup options={OUTCOMES} value={outcome} onChange={setOutcome} />
          </Card>
        </Section>
      ) : null}

      <Section
        title="What did you feel?"
        action={
          previous && previous.symptoms.length > 0 && reports.length === 0 ? (
            <TextLink label="Same as last run" onPress={() => setReports(previous.symptoms.map((s) => ({ ...s, id: newId(), situations: [...s.situations] })))} />
          ) : undefined
        }
      >
        <Card>
          <View style={styles.grid}>
            {SYMPTOMS.map((s) => {
              const on = reports.some((r) => r.symptom === s.value);
              return (
                <Pressable
                  key={s.value}
                  onPress={() => toggle(s.value)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={s.label}
                  style={({ pressed }) => [styles.symptom, on && styles.symptomOn, pressed && { opacity: 0.75 }]}
                >
                  <Text variant="subhead" tone={on ? 'onAccent' : 'primary'} style={on ? styles.bold : undefined} numberOfLines={2}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {reports.length === 0 ? (
            <Text variant="caption" tone="tertiary">
              Leave empty if the bike felt good. Select everything you noticed; you can add detail to each.
            </Text>
          ) : null}
        </Card>
      </Section>

      {reports.map((r) => (
        <SymptomDetail key={r.id} report={r} onChange={(p) => patch(r.id, p)} onRemove={() => remove(r.id)} />
      ))}

      <Section title="Notes">
        <Card>
          <TextField value={notes} onChangeText={setNotes} multiline placeholder="Optional: anything else about this run" accessibilityLabel="Run notes" />
        </Card>
      </Section>
    </Screen>
  );
}

const SEVERITY = (['1', '2', '3', '4', '5'] as const).map((v) => ({ value: v, label: v }));

function SymptomDetail({ report: r, onChange, onRemove }: { report: SymptomReport; onChange: (p: Partial<SymptomReport>) => void; onRemove: () => void }) {
  return (
    <Card padded={false}>
      <View style={styles.detailHead}>
        <Text variant="headline" style={styles.flex} numberOfLines={1}>
          {symptomLabel(r)}
        </Text>
        <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove ${symptomLabel(r)}`}>
          <Ionicons name="close-circle" size={22} color={colors.textTertiary} />
        </Pressable>
      </View>
      <View style={styles.detailBody}>
        {r.symptom === 'other' ? (
          <TextField value={r.customLabel} onChangeText={(customLabel) => onChange({ customLabel })} placeholder="Describe the symptom" error={r.customLabel.trim() ? null : 'Required'} accessibilityLabel="Symptom description" />
        ) : null}
        <View style={styles.pairRow}>
          <View style={[styles.flex, styles.labeled]}>
            <Text variant="caption" tone="secondary">
              Where
            </Text>
            <Segmented options={AFFECTED_ENDS} value={r.end} onChange={(end) => onChange({ end })} accessibilityLabel="Affected end" />
          </View>
        </View>
        <View style={styles.labeled}>
          <Text variant="caption" tone="secondary">
            Severity (1 mild – 5 severe)
          </Text>
          <Segmented options={SEVERITY} value={String(r.severity) as (typeof SEVERITY)[number]['value']} onChange={(v) => onChange({ severity: Number(v) as Severity })} accessibilityLabel="Severity" />
        </View>
      </View>
      <Collapsible
        title="Situation & confidence"
        summary={[r.situations.length ? `${r.situations.length} situation${r.situations.length === 1 ? '' : 's'}` : null, CONFIDENCE_LEVELS.find((c) => c.value === r.confidence)?.label].filter(Boolean).join(' · ')}
      >
        <MultiChipGroup label="Riding situation" options={SITUATIONS} values={r.situations} onChange={(situations) => onChange({ situations })} />
        <ChipGroup label="How sure are you?" options={CONFIDENCE_LEVELS} value={r.confidence} required onChange={(c) => c && onChange({ confidence: c })} />
        <TextField value={r.notes} onChangeText={(notes) => onChange({ notes })} placeholder="Optional note" accessibilityLabel={`${symptomLabel(r)} note`} />
      </Collapsible>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  symptom: {
    width: '48.5%',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
  },
  symptomOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: layout.cardPadding, paddingTop: layout.cardPadding },
  detailBody: { paddingHorizontal: layout.cardPadding, paddingTop: spacing.md, paddingBottom: spacing.xs, gap: spacing.md },
  pairRow: { flexDirection: 'row', gap: spacing.md },
  labeled: { gap: spacing.xs + 2 },
});
