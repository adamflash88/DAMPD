import { View } from 'react-native';

import type { DisplayUnits } from '../domain/types';
import { spacing } from '../theme/tokens';
import { Segmented, Text } from './ui';

export function UnitsEditor({ value, onChange }: { value: DisplayUnits; onChange: (u: DisplayUnits) => void }) {
  return (
    <View style={{ gap: spacing.md }}>
      <Row label="Sag & lengths">
        <Segmented
          accessibilityLabel="Length unit"
          options={[
            { value: 'mm', label: 'mm' },
            { value: 'in', label: 'in' },
          ]}
          value={value.length}
          onChange={(length) => onChange({ ...value, length })}
        />
      </Row>
      <Row label="Spring rate">
        <Segmented
          accessibilityLabel="Spring rate unit"
          options={[
            { value: 'N/mm', label: 'N/mm' },
            { value: 'kgf/mm', label: 'kgf/mm' },
          ]}
          value={value.springRate}
          onChange={(springRate) => onChange({ ...value, springRate })}
        />
      </Row>
      <Row label="Temperature">
        <Segmented
          accessibilityLabel="Temperature unit"
          options={[
            { value: 'C', label: '°C' },
            { value: 'F', label: '°F' },
          ]}
          value={value.temperature}
          onChange={(temperature) => onChange({ ...value, temperature })}
        />
      </Row>
      <Text variant="caption" tone="tertiary">
        Values are stored precisely and converted for display, so you can switch units at any time.
      </Text>
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.xs + 2 }}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      {children}
    </View>
  );
}
