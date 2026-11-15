import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, touch, typography } from '../theme/tokens';
import { AppText } from './AppText';

// ---------------------------------------------------------------------------
// Stepper: big −/+ buttons for clickers. Usable with a dirty thumb.
// ---------------------------------------------------------------------------

export interface StepperProps {
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number | null;
  step?: number;
  unit?: string;
  accessibilityLabel: string;
  highlight?: boolean;
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  unit,
  accessibilityLabel,
  highlight,
}: StepperProps) {
  const clamp = (n: number) => Math.max(min, max === null || max === undefined ? n : Math.min(max, n));
  const current = value ?? min;
  const canDec = value !== null && current > min;
  const canInc = value === null || max === null || max === undefined || current < max;

  return (
    <View
      style={styles.stepper}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: value === null ? 'not set' : `${value}${unit ? ` ${unit}` : ''}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment' && canInc) onChange(clamp(value === null ? min : current + step));
        if (e.nativeEvent.actionName === 'decrement' && canDec) onChange(clamp(current - step));
      }}
    >
      <StepButton icon="remove" disabled={!canDec} onPress={() => onChange(clamp(current - step))} />
      <View style={styles.stepperValue}>
        <AppText variant="valueLarge" tone={highlight ? 'accent' : 'primary'}>
          {value === null ? '—' : value}
        </AppText>
        {unit ? (
          <AppText variant="caption" tone="secondary">
            {unit}
          </AppText>
        ) : null}
      </View>
      <StepButton
        icon="add"
        disabled={!canInc}
        onPress={() => onChange(clamp(value === null ? min : current + step))}
      />
    </View>
  );
}

function StepButton({
  icon,
  onPress,
  disabled,
}: {
  icon: 'add' | 'remove';
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      importantForAccessibility="no"
      accessibilityElementsHidden
      style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed, disabled && styles.disabled]}
    >
      <Ionicons name={icon} size={32} color={iconColor(disabled)} />
    </Pressable>
  );
}

const iconColor = (disabled: boolean) => (disabled ? colors.textMuted : colors.textPrimary);

// ---------------------------------------------------------------------------
// NumericField: large decimal input for sag, spring rates, lengths.
// Commits on blur / submit; empty input clears the value.
// ---------------------------------------------------------------------------

export function parseDecimal(text: string): number | null {
  const normalized = text.replace(',', '.').trim();
  if (normalized === '') return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export interface NumericFieldProps {
  value: number | null;
  onCommit: (value: number | null) => void;
  unit?: string;
  placeholder?: string;
  accessibilityLabel: string;
  allowNegative?: boolean;
  highlight?: boolean;
}

export function NumericField({
  value,
  onCommit,
  unit,
  placeholder = '—',
  accessibilityLabel,
  allowNegative,
  highlight,
}: NumericFieldProps) {
  // Draft text exists only while editing; otherwise the field mirrors `value`.
  const [draft, setDraft] = useState<string | null>(null);
  const focused = draft !== null;
  const text = draft ?? (value === null ? '' : String(value));

  const commit = () => {
    if (draft === null) return;
    const parsed = parseDecimal(draft);
    const next = parsed !== null && !allowNegative ? Math.abs(parsed) : parsed;
    if (next !== value) onCommit(next);
    setDraft(null);
  };

  return (
    <View style={[styles.numeric, focused && styles.focused]}>
      <TextInput
        value={text}
        onChangeText={setDraft}
        onFocus={() => setDraft(text)}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType={allowNegative ? 'numbers-and-punctuation' : 'decimal-pad'}
        returnKeyType="done"
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        selectTextOnFocus
        accessibilityLabel={accessibilityLabel}
        style={[styles.numericInput, highlight && { color: colors.accent }]}
      />
      {unit ? (
        <AppText variant="bodyStrong" tone="secondary">
          {unit}
        </AppText>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// TextField
// ---------------------------------------------------------------------------

export function TextField({
  label,
  style,
  multiline,
  ...rest
}: TextInputProps & { label?: string }) {
  return (
    <View style={styles.field}>
      {label ? (
        <AppText variant="label" tone="secondary">
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        accessibilityLabel={label}
        {...rest}
        style={[styles.text, multiline && styles.multiline, style]}
      />
    </View>
  );
}

/**
 * Text field bound to a stored value that commits when editing ends, so we
 * don't write to storage on every keystroke.
 */
export function CommitTextField({
  value,
  onCommit,
  ...rest
}: Omit<TextInputProps, 'value' | 'onChangeText' | 'onEndEditing'> & {
  label?: string;
  value: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <TextField
      {...rest}
      value={draft ?? value}
      onChangeText={setDraft}
      onEndEditing={() => {
        if (draft !== null && draft !== value) onCommit(draft);
        setDraft(null);
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// ChipGroup: single-select (tap again to clear).
// ---------------------------------------------------------------------------

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T | null) => void;
  label?: string;
}) {
  return (
    <View style={styles.field}>
      {label ? (
        <AppText variant="label" tone="secondary">
          {label}
        </AppText>
      ) : null}
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(selected ? null : o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={o.label}
              style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && { opacity: 0.75 }]}
            >
              <AppText variant="bodyStrong" tone={selected ? 'onAccent' : 'primary'}>
                {o.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// RatingPicker: 1–5 segmented control.
// ---------------------------------------------------------------------------

export function RatingPicker({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number | null;
  onChange: (value: 1 | 2 | 3 | 4 | 5 | null) => void;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.ratingHeader}>
        <AppText variant="bodyStrong">{label}</AppText>
        {hint ? (
          <AppText variant="caption" tone="muted">
            {hint}
          </AppText>
        ) : null}
      </View>
      <View style={styles.rating} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {([1, 2, 3, 4, 5] as const).map((n) => {
          const selected = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(selected ? null : n)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${label} ${n} of 5`}
              style={({ pressed }) => [styles.ratingCell, selected && styles.chipSelected, pressed && { opacity: 0.75 }]}
            >
              <AppText variant="value" tone={selected ? 'onAccent' : 'secondary'}>
                {n}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    padding: spacing.xs,
  },
  stepButton: {
    width: touch.stepper,
    height: touch.stepper,
    borderRadius: radius.md,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPressed: { backgroundColor: colors.borderStrong },
  stepperValue: { flex: 1, alignItems: 'center' },
  disabled: { opacity: 0.35 },
  numeric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touch.large,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surface2,
  },
  focused: { borderColor: colors.accent },
  numericInput: {
    flex: 1,
    ...typography.value,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  field: { gap: spacing.sm },
  text: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: touch.min,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: touch.min,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  ratingHeader: { gap: spacing.xxs },
  rating: { flexDirection: 'row', gap: spacing.sm },
  ratingCell: {
    flex: 1,
    minHeight: touch.large,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
