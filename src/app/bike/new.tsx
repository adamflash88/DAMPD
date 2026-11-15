import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { UnitsEditor } from '../../components/UnitsEditor';
import { Button, Card, ListGroup, ListRow, Screen, Section, Text, TextField, TextLink } from '../../components/ui';
import { bikeRepository } from '../../data';
import { catalogMakes, catalogModels, catalogYears, filterOptions } from '../../domain/catalog';
import type { DisplayUnits } from '../../domain/types';
import { DEFAULT_UNITS } from '../../domain/units';
import { colors, spacing } from '../../theme/tokens';

type Step = 'year' | 'make' | 'model' | 'details';
const STEPS: Step[] = ['year', 'make', 'model', 'details'];
const STEP_TITLE: Record<Step, string> = { year: 'Model year', make: 'Manufacturer', model: 'Model', details: 'Finish up' };

interface Draft {
  year: number | null;
  make: string;
  model: string;
  catalogId: string | null;
  manualMake: boolean;
  manualModel: boolean;
  nickname: string;
  units: DisplayUnits;
}

export default function AddMotorcycleScreen() {
  const [step, setStep] = useState<Step>('year');
  const [query, setQuery] = useState('');
  const [d, setD] = useState<Draft>({
    year: null,
    make: '',
    model: '',
    catalogId: null,
    manualMake: false,
    manualModel: false,
    nickname: '',
    units: DEFAULT_UNITS,
  });
  const [otherYear, setOtherYear] = useState('');

  const go = (next: Step) => {
    setQuery('');
    setStep(next);
  };
  const back = () => {
    const i = STEPS.indexOf(step);
    if (i > 0) go(STEPS[i - 1]!);
  };

  const years = useMemo(() => catalogYears(), []);
  const makes = useMemo(() => (d.year ? catalogMakes(d.year) : []), [d.year]);
  const models = useMemo(() => (d.year && d.make ? catalogModels(d.year, d.make) : []), [d.year, d.make]);

  const save = async () => {
    if (!d.year || !d.make.trim() || !d.model.trim()) return;
    const bike = await bikeRepository.create({
      year: d.year,
      make: d.make,
      model: d.model,
      nickname: d.nickname,
      catalogId: d.catalogId,
      units: d.units,
    });
    await bikeRepository.setActive(bike.id);
    router.replace(`/bike/${bike.id}`);
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <Screen
      footer={
        step === 'details' ? (
          <Button label="Save motorcycle" size="lg" icon="checkmark" onPress={save} disabled={!d.model.trim() || !d.make.trim()} />
        ) : undefined
      }
    >
      <View style={styles.progress}>
        <View style={styles.flex}>
          <Text variant="overline" tone="tertiary">
            Step {stepIndex + 1} of {STEPS.length}
          </Text>
          <Text variant="title">{STEP_TITLE[step]}</Text>
        </View>
        {stepIndex > 0 ? <TextLink label="Back" onPress={back} /> : null}
      </View>
      <View style={styles.bar}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.barSeg, i <= stepIndex && styles.barSegOn]} />
        ))}
      </View>

      {d.year && step !== 'year' ? (
        <Text variant="subhead" tone="secondary">
          {[d.year, d.make, d.model].filter(Boolean).join(' ')}
        </Text>
      ) : null}

      {step === 'year' ? (
        <>
          <ListGroup>
            {years.map((y) => (
              <ListRow
                key={y}
                title={String(y)}
                onPress={() => {
                  setD({ ...d, year: y });
                  go('make');
                }}
              />
            ))}
          </ListGroup>
          <Section title="Other year">
            <Card>
              <View style={styles.inline}>
                <View style={styles.flex}>
                  <TextField
                    value={otherYear}
                    onChangeText={(t) => setOtherYear(t.replace(/[^0-9]/g, '').slice(0, 4))}
                    keyboardType="number-pad"
                    placeholder="e.g. 2014"
                    accessibilityLabel="Other model year"
                  />
                </View>
                <Button
                  label="Next"
                  disabled={!(Number(otherYear) >= 1950 && Number(otherYear) <= 2100)}
                  onPress={() => {
                    setD({ ...d, year: Number(otherYear), manualMake: catalogMakes(Number(otherYear)).length === 0 });
                    go('make');
                  }}
                />
              </View>
            </Card>
          </Section>
        </>
      ) : null}

      {step === 'make' ? (
        d.manualMake || makes.length === 0 ? (
          <ManualEntry
            label="Manufacturer"
            placeholder="e.g. Beta"
            initial={d.make}
            onSubmit={(make) => {
              setD({ ...d, make, model: '', catalogId: null, manualMake: true, manualModel: true });
              go('model');
            }}
            onUseList={makes.length > 0 ? () => setD({ ...d, manualMake: false }) : undefined}
          />
        ) : (
          <>
            <TextField value={query} onChangeText={setQuery} placeholder="Search manufacturers" autoCorrect={false} accessibilityLabel="Search manufacturers" />
            <ListGroup>
              {filterOptions(makes, query, (m) => m).map((m) => (
                <ListRow
                  key={m}
                  title={m}
                  onPress={() => {
                    setD({ ...d, make: m, model: '', catalogId: null, manualModel: false });
                    go('model');
                  }}
                />
              ))}
            </ListGroup>
            <NotListed what="manufacturer" onPress={() => setD({ ...d, manualMake: true })} />
          </>
        )
      ) : null}

      {step === 'model' ? (
        d.manualModel || models.length === 0 ? (
          <ManualEntry
            label="Model"
            placeholder="e.g. RX 300"
            initial={d.model}
            onSubmit={(model) => {
              setD({ ...d, model, catalogId: null, manualModel: true });
              go('details');
            }}
            onUseList={models.length > 0 ? () => setD({ ...d, manualModel: false }) : undefined}
          />
        ) : (
          <>
            <TextField value={query} onChangeText={setQuery} placeholder={`Search ${d.make} models`} autoCorrect={false} accessibilityLabel="Search models" />
            <ListGroup>
              {filterOptions(models, query, (m) => m.model).map((m) => (
                <ListRow
                  key={m.id}
                  title={m.model}
                  onPress={() => {
                    setD({ ...d, model: m.model, catalogId: m.id });
                    go('details');
                  }}
                />
              ))}
            </ListGroup>
            <NotListed what="model" onPress={() => setD({ ...d, manualModel: true })} />
          </>
        )
      ) : null}

      {step === 'details' ? (
        <>
          <Card>
            <Text variant="headline">
              {d.year} {d.make} {d.model}
            </Text>
            <Text variant="caption" tone="secondary">
              {d.catalogId
                ? 'From the demo catalog (names only). Suspension starts empty for you to fill in.'
                : 'Entered manually. Suspension starts empty for you to fill in.'}
            </Text>
            <TextField
              label="Nickname (optional)"
              value={d.nickname}
              onChangeText={(nickname) => setD({ ...d, nickname })}
              placeholder="e.g. Race bike"
              returnKeyType="done"
            />
          </Card>
          <Section title="Units">
            <Card>
              <UnitsEditor value={d.units} onChange={(units) => setD({ ...d, units })} />
            </Card>
          </Section>
        </>
      ) : null}
    </Screen>
  );
}

function NotListed({ what, onPress }: { what: string; onPress: () => void }) {
  return (
    <View style={styles.notListed}>
      <Text variant="subhead" tone="secondary">
        Not listed?
      </Text>
      <TextLink label={`Enter ${what} manually`} onPress={onPress} />
    </View>
  );
}

function ManualEntry({
  label,
  placeholder,
  initial,
  onSubmit,
  onUseList,
}: {
  label: string;
  placeholder: string;
  initial: string;
  onSubmit: (value: string) => void;
  onUseList?: () => void;
}) {
  const [value, setValue] = useState(initial);
  const ok = value.trim().length > 0;
  return (
    <Card>
      <TextField
        label={label}
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        autoFocus
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => ok && onSubmit(value.trim())}
      />
      <View style={styles.inline}>
        {onUseList ? <TextLink label="Choose from list" onPress={onUseList} /> : <View />}
        <Button label="Next" disabled={!ok} onPress={() => onSubmit(value.trim())} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  progress: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  bar: { flexDirection: 'row', gap: 4, marginTop: -spacing.sm },
  barSeg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.borderStrong },
  barSegOn: { backgroundColor: colors.accent },
  inline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  notListed: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'center' },
});
