import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';
import { Text } from './Text';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

function Chip({
  label,
  selected,
  onPress,
  role,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  role: 'radio' | 'checkbox';
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityState={role === 'radio' ? { selected } : { checked: selected }}
      accessibilityLabel={label}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
    >
      <Text variant="subhead" tone={selected ? 'onAccent' : 'primary'} style={selected ? styles.selectedText : undefined}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Single select. Tapping the selected chip clears it unless `required`. */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  required,
  scroll,
}: {
  options: readonly ChipOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  label?: string;
  required?: boolean;
  scroll?: boolean;
}) {
  const chips = options.map((o) => (
    <Chip
      key={o.value}
      label={o.label}
      role="radio"
      selected={o.value === value}
      onPress={() => onChange(o.value === value ? (required ? o.value : null) : o.value)}
    />
  ));
  return (
    <View style={styles.group}>
      {label ? (
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
      ) : null}
      {scroll ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow} accessibilityRole="radiogroup">
          {chips}
        </ScrollView>
      ) : (
        <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={label}>
          {chips}
        </View>
      )}
    </View>
  );
}

/** Multi select. */
export function MultiChipGroup<T extends string>({
  options,
  values,
  onChange,
  label,
}: {
  options: readonly ChipOption<T>[];
  values: readonly T[];
  onChange: (values: T[]) => void;
  label?: string;
}) {
  return (
    <View style={styles.group}>
      {label ? (
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
      ) : null}
      <View style={styles.wrap} accessibilityLabel={label}>
        {options.map((o) => {
          const selected = values.includes(o.value);
          return (
            <Chip
              key={o.value}
              label={o.label}
              role="checkbox"
              selected={selected}
              onPress={() => onChange(selected ? values.filter((v) => v !== o.value) : [...values, o.value])}
            />
          );
        })}
      </View>
    </View>
  );
}

/** Equal-width segmented control (always one selected). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text variant="subhead" tone={selected ? 'primary' : 'secondary'} style={selected ? styles.selectedText : undefined}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs + 2 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  scrollRow: { gap: spacing.sm, paddingRight: spacing.lg },
  chip: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  selectedText: { fontWeight: '700' },
  pressed: { opacity: 0.7 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  segment: { flex: 1, minHeight: 38, borderRadius: radius.sm + 1, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: colors.surfaceHigh },
});
