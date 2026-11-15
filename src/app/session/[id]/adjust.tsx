import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { ChipGroup, NumericField, Stepper, TextField } from '../../../components/Inputs';
import { Card, EmptyState, Row, Screen, SectionHeader } from '../../../components/Layout';
import { sessionRepository, useEffectiveSetup, useSession } from '../../../data';
import { formatValue, getClickerRange, getSettingDef, settingDefsFor, unitLabel } from '../../../domain/settings';
import { effectiveValue } from '../../../domain/setup';
import type { SettingKey } from '../../../domain/types';
import { spacing } from '../../../theme/tokens';

const QUICK_REASONS = [
  'Harsh on small bumps',
  'Bottoming',
  'Diving under braking',
  'Rear kicking',
  'Wallowing',
  'Not turning in',
  'Unstable at speed',
];

export default function LogAdjustmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession(id);
  const effective = useEffectiveSetup(session);
  const [key, setKey] = useState<SettingKey | null>(null);
  const [after, setAfter] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  if (!session || !effective) {
    return (
      <Screen edges={['bottom']}>
        <EmptyState title="Session not found" />
      </Screen>
    );
  }

  const { units } = session.snapshot;
  const before = key ? effectiveValue(session.snapshot.setup, session.adjustments, key) : null;
  const def = key ? getSettingDef(key) : null;

  const pick = (k: SettingKey | null) => {
    setKey(k);
    setAfter(k ? effectiveValue(session.snapshot.setup, session.adjustments, k) : null);
  };

  const canSave = key !== null && after !== null && after !== before;

  return (
    <Screen edges={['bottom']}>
      <SectionHeader title="1 · Setting" />
      <Card>
        {(['fork', 'shock'] as const).map((end) => (
          <ChipGroup
            key={end}
            label={end === 'fork' ? 'Fork' : 'Shock'}
            options={settingDefsFor(end).map((d) => ({ value: d.key, label: d.shortLabel }))}
            value={key && getSettingDef(key).end === end ? key : null}
            onChange={pick}
          />
        ))}
      </Card>

      {key && def ? (
        <>
          <SectionHeader title={`2 · ${def.end === 'fork' ? 'Fork' : 'Shock'} ${def.label}`} />
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <AppText tone="secondary">Before</AppText>
              <AppText variant="value" tone="secondary">
                {formatValue(before, def)} {def.kind === 'clicker' ? 'clicks' : unitLabel(def.kind, units)}
              </AppText>
            </Row>
            <AppText variant="label" tone="secondary">
              After
            </AppText>
            {def.kind === 'clicker' ? (
              <Stepper
                value={after}
                max={getClickerRange(effective, key)?.value ?? null}
                unit={`clicks ${unitLabel('clicker', units)}`}
                accessibilityLabel={`New ${def.label}`}
                highlight={after !== before}
                onChange={setAfter}
              />
            ) : (
              <NumericField
                value={after}
                unit={unitLabel(def.kind, units)}
                accessibilityLabel={`New ${def.label}`}
                highlight={after !== before}
                onCommit={setAfter}
              />
            )}
          </Card>

          <SectionHeader title="3 · Reason" />
          <Card>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {QUICK_REASONS.map((r) => (
                <Button
                  key={r}
                  label={r}
                  variant={reason === r ? 'primary' : 'secondary'}
                  onPress={() => setReason(reason === r ? '' : r)}
                />
              ))}
            </View>
            <TextField value={reason} onChangeText={setReason} placeholder="Why this change?" multiline />
          </Card>
        </>
      ) : null}

      <Button
        label="Save adjustment"
        size="large"
        icon="checkmark"
        disabled={!canSave}
        onPress={async () => {
          if (!key || after === null) return;
          await sessionRepository.addAdjustment(session.id, { setting: key, after, reason });
          router.back();
        }}
      />
    </Screen>
  );
}
