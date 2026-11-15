import { StyleSheet, View } from 'react-native';

import { getClickerRange, getSetting, getSettingDef, formatValue, settingDefsFor, unitLabel } from '../domain/settings';
import { clampClicker, withClickerRange, withSetting } from '../domain/setup';
import type { BikeUnits, SettingKey, SuspensionEndId, SuspensionSetup } from '../domain/types';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';
import { IllustrativeBadge } from './IllustrativeBadge';
import { NumericField, Stepper } from './Inputs';

/** Editable row for one numeric setting. Editing marks the value verified. */
export function SettingEditor({
  setup,
  settingKey,
  units,
  onChange,
}: {
  setup: SuspensionSetup;
  settingKey: SettingKey;
  units: BikeUnits;
  onChange: (next: SuspensionSetup) => void;
}) {
  const def = getSettingDef(settingKey);
  const spec = getSetting(setup, settingKey);
  const range = getClickerRange(setup, settingKey);
  const unit = unitLabel(def.kind, units);

  return (
    <View style={styles.editor}>
      <View style={styles.editorHeader}>
        <AppText variant="bodyStrong" style={styles.flex}>
          {def.label}
        </AppText>
        {!spec.isVerified ? (
          <IllustrativeBadge onConfirm={() => onChange(withSetting(setup, settingKey, spec.value, true))} />
        ) : null}
      </View>

      {def.kind === 'clicker' ? (
        <>
          <Stepper
            value={spec.value}
            max={range?.value ?? null}
            unit={`clicks ${unit}`}
            accessibilityLabel={def.label}
            onChange={(n) => onChange(withSetting(setup, settingKey, clampClicker(setup, settingKey, n)))}
          />
          <View style={styles.rangeRow}>
            <AppText variant="caption" tone="secondary" style={styles.flex}>
              Adjuster range (total clicks)
            </AppText>
            {range && !range.isVerified ? (
              <IllustrativeBadge
                compact
                onConfirm={() => onChange(withClickerRange(setup, settingKey, range.value, true))}
              />
            ) : null}
            <View style={styles.rangeInput}>
              <NumericField
                value={range?.value ?? null}
                accessibilityLabel={`${def.label} total clicks`}
                onCommit={(max) => {
                  const rounded = max === null ? null : Math.round(max);
                  let next = withClickerRange(setup, settingKey, rounded);
                  const current = getSetting(next, settingKey);
                  if (rounded !== null && current.value !== null && current.value > rounded) {
                    next = withSetting(next, settingKey, rounded, current.isVerified);
                  }
                  onChange(next);
                }}
              />
            </View>
          </View>
        </>
      ) : (
        <NumericField
          value={spec.value}
          unit={unit}
          accessibilityLabel={`${def.label} in ${unit}`}
          onCommit={(v) => onChange(withSetting(setup, settingKey, v))}
        />
      )}
    </View>
  );
}

/** Compact read-only grid of one end's numeric settings. */
export function SetupSummary({
  setup,
  units,
  end,
  highlightKeys,
}: {
  setup: SuspensionSetup;
  units: BikeUnits;
  end: SuspensionEndId;
  highlightKeys?: ReadonlySet<SettingKey>;
}) {
  return (
    <View style={styles.grid}>
      {settingDefsFor(end).map((def) => {
        const spec = getSetting(setup, def.key);
        const changed = highlightKeys?.has(def.key) ?? false;
        const unit = def.kind === 'clicker' ? '' : unitLabel(def.kind, units);
        return (
          <View key={def.key} style={[styles.cell, changed && styles.cellChanged]}>
            <AppText variant="caption" tone="secondary" numberOfLines={1}>
              {def.shortLabel}
            </AppText>
            <View style={styles.cellValue}>
              <AppText variant="value" tone={changed ? 'accent' : 'primary'}>
                {formatValue(spec.value, def)}
              </AppText>
              {unit && spec.value !== null ? (
                <AppText variant="caption" tone="muted">
                  {unit}
                </AppText>
              ) : null}
            </View>
            {!spec.isVerified && spec.value !== null ? (
              <View style={styles.dot} accessibilityLabel="Illustrative value" />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function IllustrativeLegend() {
  return (
    <View style={styles.legend}>
      <View style={styles.legendDot} />
      <AppText variant="caption" tone="secondary">
        Illustrative: unverified seed value
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  editor: { gap: spacing.sm, paddingVertical: spacing.sm },
  editorHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rangeInput: { width: 110 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: {
    flexBasis: '31%',
    flexGrow: 1,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.surface2,
  },
  cellChanged: { borderColor: colors.accent, backgroundColor: colors.accentSubtle },
  cellValue: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  dot: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.illustrative,
  },
  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.illustrative },
});
