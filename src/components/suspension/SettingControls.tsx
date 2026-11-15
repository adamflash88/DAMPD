import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  conventionDescription,
  formatAdjusterNumber,
  mechanismUnit,
  normalizeAdjusterValue,
  validateSetting,
  type MeasurementDef,
} from '../../domain/settings';
import type { Adjuster, DisplayUnits, Value } from '../../domain/types';
import { displayDecimals, formatNumber, fromDisplay, toDisplay, unitSymbol } from '../../domain/units';
import { colors, layout, radius, spacing, touch } from '../../theme/tokens';
import { NumberInput, SourceMark, Text } from '../ui';

/**
 * Compact adjuster control:
 *   Compression                [ − ]  10  [ + ]
 *   clicks out from full stiff · of 20
 * The value is also directly editable (tap to type).
 */
export function AdjusterRow({
  adjuster,
  value,
  onChange,
  label,
  highlight,
}: {
  adjuster: Adjuster;
  /** Defaults to adjuster.current. */
  value?: Value<number>;
  onChange: (value: number | null) => void;
  label?: string;
  highlight?: boolean;
}) {
  const v = value ?? adjuster.current;
  const [error, setError] = useState<string | null>(null);
  const max = adjuster.range.value;
  const current = v.value;
  const canDec = current !== null && current > 0;
  const canInc = current === null || max === null || current < max;
  const name = label ?? adjuster.label;
  const step = (dir: 1 | -1) => {
    setError(null);
    onChange(normalizeAdjusterValue(adjuster, current === null ? 0 : current + dir * adjuster.step));
  };
  const caption = `${mechanismUnit(adjuster.mechanism)} ${conventionDescription(adjuster.convention)}${
    max !== null ? ` · of ${formatAdjusterNumber(adjuster, max)}` : ''
  }`;

  return (
    <View style={styles.row}>
      <View style={styles.labelCol}>
        <View style={styles.labelLine}>
          <Text variant="bodyStrong" numberOfLines={2} style={styles.shrink}>
            {name}
          </Text>
          <SourceMark source={v.value === null ? 'unknown' : v.source} />
        </View>
        <Text variant="caption" tone={error ? 'danger' : 'tertiary'} numberOfLines={2}>
          {error ?? caption}
        </Text>
      </View>
      <View
        style={styles.stepper}
        accessible={false}
      >
        <StepButton icon="remove" disabled={!canDec} label={`Decrease ${name}`} onPress={() => step(-1)} />
        <NumberInput
          value={current}
          width={64}
          format={(n) => formatAdjusterNumber(adjuster, n)}
          accessibilityLabel={`${name}, ${caption}`}
          highlight={highlight}
          validate={(n) => (max !== null && n > max ? `Range is 0–${formatAdjusterNumber(adjuster, max)}` : null)}
          onError={setError}
          onCommit={(n) => onChange(n === null ? null : normalizeAdjusterValue(adjuster, n))}
        />
        <StepButton icon="add" disabled={!canInc} label={`Increase ${name}`} onPress={() => step(1)} />
      </View>
    </View>
  );
}

function StepButton({
  icon,
  onPress,
  disabled,
  label,
}: {
  icon: 'add' | 'remove';
  onPress: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [styles.stepButton, pressed && styles.stepPressed, disabled && styles.disabled]}
    >
      <Ionicons name={icon} size={22} color={disabled ? colors.textTertiary : colors.textPrimary} />
    </Pressable>
  );
}

/** Label + hint on the left, unit-aware numeric input on the right. Stores canonical values. */
export function MeasurementRow({
  def,
  value,
  units,
  onChange,
  highlight,
}: {
  def: MeasurementDef;
  value: Value<number>;
  units: DisplayUnits;
  onChange: (canonical: number | null) => void;
  highlight?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const shown = value.value === null ? null : toDisplay(def.quantity, value.value, units);
  const decimals = displayDecimals(def.quantity, units);
  return (
    <View style={styles.row}>
      <View style={styles.labelCol}>
        <View style={styles.labelLine}>
          <Text variant="bodyStrong" numberOfLines={1} style={styles.shrink}>
            {def.label}
          </Text>
          <SourceMark source={value.value === null ? 'unknown' : value.source} />
        </View>
        <Text variant="caption" tone={error ? 'danger' : 'tertiary'} numberOfLines={2}>
          {error ?? def.hint}
        </Text>
      </View>
      <NumberInput
        value={shown}
        width={112}
        unit={unitSymbol(def.quantity, units)}
        format={(n) => formatNumber(n, decimals)}
        accessibilityLabel={`${def.label} in ${unitSymbol(def.quantity, units)}`}
        highlight={highlight}
        onError={setError}
        validate={(n) => validateSetting({ path: `${def.end}.m.${def.key}`, end: def.end, label: def.label, shortLabel: def.shortLabel, measurement: def }, fromDisplay(def.quantity, n, units), units)}
        onCommit={(n) => onChange(n === null ? null : fromDisplay(def.quantity, n, units))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touch.row + 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: layout.cardPadding,
  },
  labelCol: { flex: 1, gap: 2 },
  labelLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  shrink: { flexShrink: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  stepButton: {
    width: touch.min,
    height: touch.min,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPressed: { backgroundColor: colors.borderStrong },
  disabled: { opacity: 0.35 },
});
