import { useState } from 'react';
import { View } from 'react-native';

import { DEFAULT_UNITS } from '../domain/factories';
import type { BikeUnits } from '../domain/types';
import { spacing } from '../theme/tokens';
import { AppText } from './AppText';
import { Button } from './Button';
import { ChipGroup, TextField } from './Inputs';
import { Card, SectionHeader } from './Layout';

export interface BikeFormValues {
  year: string;
  make: string;
  model: string;
  nickname: string;
  units: BikeUnits;
}

export function BikeForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<BikeFormValues>;
  submitLabel: string;
  onSubmit: (values: { year: number; make: string; model: string; nickname: string; units: BikeUnits }) => void;
}) {
  const [values, setValues] = useState<BikeFormValues>({
    year: initial?.year ?? String(new Date().getFullYear()),
    make: initial?.make ?? '',
    model: initial?.model ?? '',
    nickname: initial?.nickname ?? '',
    units: initial?.units ?? DEFAULT_UNITS,
  });
  const set = <K extends keyof BikeFormValues>(key: K, v: BikeFormValues[K]) =>
    setValues((s) => ({ ...s, [key]: v }));
  const setUnit = <K extends keyof BikeUnits>(key: K, v: BikeUnits[K] | null) => {
    if (v !== null) set('units', { ...values.units, [key]: v });
  };

  const year = Number(values.year);
  const valid = Number.isInteger(year) && year > 1900 && year < 2200 && values.make.trim() && values.model.trim();

  return (
    <View style={{ gap: spacing.lg }}>
      <Card>
        <TextField
          label="Year"
          value={values.year}
          onChangeText={(t) => set('year', t.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={4}
        />
        <TextField label="Make" value={values.make} onChangeText={(t) => set('make', t)} placeholder="e.g. Kawasaki" />
        <TextField label="Model" value={values.model} onChangeText={(t) => set('model', t)} placeholder="e.g. KX250" />
        <TextField
          label="Nickname (optional)"
          value={values.nickname}
          onChangeText={(t) => set('nickname', t)}
          placeholder="e.g. Practice bike"
        />
      </Card>

      <SectionHeader title="Units & conventions" />
      <Card>
        <ChipGroup
          label="Spring rate"
          options={[
            { value: 'N/mm', label: 'N/mm' },
            { value: 'kg/mm', label: 'kg/mm' },
          ]}
          value={values.units.springRate}
          onChange={(v) => setUnit('springRate', v)}
        />
        <ChipGroup
          label="Sag"
          options={[
            { value: 'mm', label: 'mm' },
            { value: 'in', label: 'in' },
          ]}
          value={values.units.sag}
          onChange={(v) => setUnit('sag', v)}
        />
        <ChipGroup
          label="Fork oil level"
          options={[
            { value: 'mm', label: 'mm (air gap)' },
            { value: 'cc', label: 'cc (volume)' },
          ]}
          value={values.units.oilLevel}
          onChange={(v) => setUnit('oilLevel', v)}
        />
        <ChipGroup
          label="Temperature"
          options={[
            { value: 'C', label: '°C' },
            { value: 'F', label: '°F' },
          ]}
          value={values.units.temperature}
          onChange={(v) => setUnit('temperature', v)}
        />
        <ChipGroup
          label="Clicker convention"
          options={[
            { value: 'clicksOutFromFullStiff', label: 'Out from full stiff' },
            { value: 'clicksInFromFullSoft', label: 'In from full soft' },
          ]}
          value={values.units.clickerConvention}
          onChange={(v) => setUnit('clickerConvention', v)}
        />
        <AppText variant="caption" tone="muted">
          Changing a unit relabels values. It does not convert numbers you have already entered.
        </AppText>
      </Card>

      <Button
        label={submitLabel}
        size="large"
        disabled={!valid}
        onPress={() =>
          onSubmit({
            year,
            make: values.make.trim(),
            model: values.model.trim(),
            nickname: values.nickname.trim(),
            units: values.units,
          })
        }
      />
    </View>
  );
}
