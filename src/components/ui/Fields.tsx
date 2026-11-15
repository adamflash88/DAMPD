import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, touch, typography } from '../../theme/tokens';
import { Text } from './Text';

export function parseDecimal(text: string): number | null {
  const normalized = text.replace(',', '.').trim();
  if (normalized === '' || normalized === '-' || normalized === '.') return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export interface TextFieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string | null;
}

export function TextField({ label, hint, error, style, multiline, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      {label ? (
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.accent}
        multiline={multiline}
        accessibilityLabel={label}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[styles.input, multiline && styles.multiline, focused && styles.focused, !!error && styles.errorBorder, style]}
      />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="tertiary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** Text field bound to stored text; commits when editing ends (not per keystroke). */
export function CommitTextField({
  value,
  onCommit,
  ...rest
}: Omit<TextFieldProps, 'value' | 'onChangeText' | 'onEndEditing'> & { value: string; onCommit: (v: string) => void }) {
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

export interface NumberInputProps {
  /** Number in DISPLAY units. */
  value: number | null;
  /** Formats the stored value for display when not editing. */
  format?: (n: number) => string;
  onCommit: (value: number | null) => void;
  /** Return an error message to reject the input. */
  validate?: (value: number) => string | null;
  unit?: string;
  placeholder?: string;
  accessibilityLabel: string;
  allowNegative?: boolean;
  width?: number;
  highlight?: boolean;
  onError?: (message: string | null) => void;
}

/** Compact inline numeric input with unit suffix. Draft text only exists while editing. */
export function NumberInput({
  value,
  format = String,
  onCommit,
  validate,
  unit,
  placeholder = '—',
  accessibilityLabel,
  allowNegative,
  width = 96,
  highlight,
  onError,
}: NumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shown = draft ?? (value === null ? '' : format(value));

  const setErr = (e: string | null) => {
    setError(e);
    onError?.(e);
  };

  const commit = () => {
    if (draft === null) return;
    const parsed = parseDecimal(draft);
    const next = parsed !== null && !allowNegative ? Math.abs(parsed) : parsed;
    const problem = next === null ? null : (validate?.(next) ?? null);
    if (problem) {
      setErr(problem);
      setDraft(null);
      return;
    }
    setErr(null);
    if (next !== value) onCommit(next);
    setDraft(null);
  };

  return (
    <View style={[styles.numberBox, { width }, draft !== null && styles.focused, !!error && styles.errorBorder]}>
      <TextInput
        value={shown}
        onChangeText={setDraft}
        onFocus={() => setDraft(value === null ? '' : String(Number(value.toFixed(4))))}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType={allowNegative ? 'numbers-and-punctuation' : 'decimal-pad'}
        returnKeyType="done"
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.accent}
        selectTextOnFocus
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={error ?? undefined}
        maxFontSizeMultiplier={1.3}
        style={[styles.numberInput, highlight && { color: colors.accent }]}
      />
      {unit ? (
        <Text variant="caption" tone="tertiary" numberOfLines={1}>
          {unit}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs + 2 },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: touch.min,
    borderWidth: 1,
    borderColor: colors.surfaceRaised,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top', paddingTop: spacing.sm + 2 },
  focused: { borderColor: colors.accent },
  errorBorder: { borderColor: colors.danger },
  numberBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: touch.min,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.surfaceRaised,
  },
  numberInput: { flex: 1, ...typography.value, color: colors.textPrimary, paddingVertical: spacing.xs, textAlign: 'right' },
});
