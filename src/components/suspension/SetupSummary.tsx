import { StyleSheet, View } from 'react-native';

import { adjusterPath, adjusterShortLabel, formatAdjusterNumber, measurementPath } from '../../domain/settings';
import type { DisplayUnits, SettingPath, SuspensionEnd, SuspensionSetup } from '../../domain/types';
import { formatQuantity, unitSymbol } from '../../domain/units';
import { colors, spacing } from '../../theme/tokens';
import { Metric, MetricRow, SourceMark, Text } from '../ui';

/**
 * Compact two-line summary of the most useful adjustable settings:
 *   FORK   Comp 10 · Reb 10
 *   SHOCK  HSC 1½ · LSC 10 · Reb 10 · Sag 105
 */
export function SetupSummary({
  setup,
  units,
  highlight,
  showSag = true,
}: {
  setup: SuspensionSetup;
  units: DisplayUnits;
  highlight?: ReadonlySet<SettingPath>;
  showSag?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <EndSummary end="fork" setup={setup} units={units} highlight={highlight} showSag={false} />
      <EndSummary end="shock" setup={setup} units={units} highlight={highlight} showSag={showSag} />
    </View>
  );
}

function EndSummary({
  end,
  setup,
  units,
  highlight,
  showSag,
}: {
  end: SuspensionEnd;
  setup: SuspensionSetup;
  units: DisplayUnits;
  highlight?: ReadonlySet<SettingPath>;
  showSag: boolean;
}) {
  const adjusters = setup[end].adjusters.slice(0, 4);
  const sag = end === 'shock' && showSag ? setup.shock.measurements.raceSag : null;
  const spring = end === 'shock' && showSag ? setup.shock.measurements.springRate : null;
  return (
    <View style={styles.end}>
      <Text variant="overline" tone="tertiary" style={styles.endLabel}>
        {end === 'fork' ? 'Fork' : 'Shock'}
      </Text>
      {adjusters.length === 0 ? (
        <Text variant="caption" tone="tertiary">
          No adjusters set up
        </Text>
      ) : (
        <MetricRow>
          {adjusters.map((a) => {
            const changed = highlight?.has(adjusterPath(end, a.id));
            return (
              <Metric
                key={a.id}
                label={adjusterShortLabel(a)}
                value={formatAdjusterNumber(a, a.current.value)}
                tone={changed ? 'accent' : 'primary'}
                mark={<SourceMark source={a.current.value === null ? 'unknown' : a.current.source} />}
              />
            );
          })}
        </MetricRow>
      )}
      {sag && spring ? (
        <MetricRow>
          <Metric
            label="Race sag"
            value={formatQuantity('length', sag.value, units, false)}
            unit={sag.value === null ? undefined : unitSymbol('length', units)}
            tone={highlight?.has(measurementPath('shock', 'raceSag')) ? 'accent' : 'primary'}
            mark={<SourceMark source={sag.value === null ? 'unknown' : sag.source} />}
          />
          <Metric
            label="Spring"
            value={formatQuantity('springRate', spring.value, units, false)}
            unit={spring.value === null ? undefined : unitSymbol('springRate', units)}
            tone={highlight?.has(measurementPath('shock', 'springRate')) ? 'accent' : 'primary'}
            mark={<SourceMark source={spring.value === null ? 'unknown' : spring.source} />}
          />
        </MetricRow>
      ) : null}
    </View>
  );
}

/** One-line legend shown once when demo values are present. */
export function DemoLegend() {
  return (
    <View style={styles.legend}>
      <View style={styles.legendDot} />
      <Text variant="caption" tone="tertiary">
        Demo value: not verified
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  end: { gap: spacing.xs + 2 },
  endLabel: { paddingLeft: 2 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning },
});
