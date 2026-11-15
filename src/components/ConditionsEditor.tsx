import { DIRT_TYPES, MOISTURE_LEVELS, RUT_LEVELS } from '../domain/labels';
import type { TemperatureUnit, TrackConditions } from '../domain/types';
import { AppText } from './AppText';
import { ChipGroup, NumericField } from './Inputs';

export function ConditionsEditor({
  value,
  temperatureUnit,
  onChange,
}: {
  value: TrackConditions;
  temperatureUnit: TemperatureUnit;
  onChange: (patch: Partial<TrackConditions>) => void;
}) {
  return (
    <>
      <ChipGroup label="Dirt type" options={DIRT_TYPES} value={value.dirtType} onChange={(dirtType) => onChange({ dirtType })} />
      <ChipGroup label="Moisture" options={MOISTURE_LEVELS} value={value.moisture} onChange={(moisture) => onChange({ moisture })} />
      <ChipGroup label="Ruts" options={RUT_LEVELS} value={value.ruts} onChange={(ruts) => onChange({ ruts })} />
      <AppText variant="label" tone="secondary">
        Air temperature
      </AppText>
      <NumericField
        value={value.temperature}
        unit={`°${temperatureUnit}`}
        allowNegative
        accessibilityLabel={`Air temperature in degrees ${temperatureUnit}`}
        onCommit={(temperature) => onChange({ temperature })}
      />
    </>
  );
}
