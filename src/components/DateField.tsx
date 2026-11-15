import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { todayISODate } from '../domain/ids';
import { colors, radius, spacing, touch } from '../theme/tokens';
import { AppText } from './AppText';

function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : new Date();
}

/** Calendar date field storing YYYY-MM-DD (local). */
export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const date = parseISODate(value);

  return (
    <View style={styles.field}>
      <AppText variant="label" tone="secondary">
        {label}
      </AppText>
      {Platform.OS === 'ios' ? (
        <View style={styles.box}>
          <DateTimePicker
            value={date}
            mode="date"
            display="compact"
            themeVariant="dark"
            accentColor={colors.accent}
            onChange={(_, d) => d && onChange(todayISODate(d))}
            accessibilityLabel={label}
          />
        </View>
      ) : (
        <>
          <Pressable
            onPress={() => setOpen(true)}
            style={styles.box}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${value}`}
          >
            <AppText variant="valueSmall">{value}</AppText>
          </Pressable>
          {open ? (
            <DateTimePicker
              value={date}
              mode="date"
              onChange={(_, d) => {
                setOpen(false);
                if (d) onChange(todayISODate(d));
              }}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  box: {
    minHeight: touch.min,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});
