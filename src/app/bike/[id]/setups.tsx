import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActionSheetIOS, Alert, Platform, StyleSheet, View } from 'react-native';

import { Button, Card, EmptyState, ListGroup, ListRow, Screen, Section, Text, TextField } from '../../../components/ui';
import { savedSetupRepository, useBike, useSavedSetups } from '../../../data';
import type { Bike, SavedSetup } from '../../../domain/types';
import { spacing } from '../../../theme/tokens';

const ORIGIN: Record<SavedSetup['origin'], string> = {
  user: 'Saved by you',
  session: 'Saved from a session',
  autoBeforeRestore: 'Kept automatically before a restore',
};

export default function SavedSetupsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bike = useBike(id);
  if (!bike) {
    return (
      <Screen>
        <EmptyState title="Motorcycle not found" />
      </Screen>
    );
  }
  return <Setups bike={bike} />;
}

function Setups({ bike }: { bike: Bike }) {
  const saved = useSavedSetups(bike.id);
  const [name, setName] = useState('');

  const restore = (s: SavedSetup) =>
    Alert.alert(
      `Restore "${s.name}"?`,
      'This replaces the current suspension profile. Your current setup is saved first, so nothing is lost. Past sessions are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            await savedSetupRepository.restore(s.id);
            Alert.alert('Setup restored', 'Your previous setup was kept in this list.');
          },
        },
      ],
    );

  const remove = (s: SavedSetup) =>
    Alert.alert(`Delete "${s.name}"?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void savedSetupRepository.remove(s.id) },
    ]);

  const rename = (s: SavedSetup) => {
    if (Platform.OS === 'ios') Alert.prompt('Rename setup', undefined, (n) => void savedSetupRepository.rename(s.id, n), 'plain-text', s.name);
  };

  const compare = (s: SavedSetup) => router.push({ pathname: '/compare', params: { a: `setup:${s.id}`, b: `current:${bike.id}` } });

  const open = (s: SavedSetup) => {
    const actions: [string, () => void][] = [
      ['Compare with current', () => compare(s)],
      ['Restore this setup', () => restore(s)],
      ...(Platform.OS === 'ios' ? ([['Rename', () => rename(s)]] as [string, () => void][]) : []),
      ['Delete', () => remove(s)],
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: s.name, options: [...actions.map((a) => a[0]), 'Cancel'], cancelButtonIndex: actions.length, destructiveButtonIndex: actions.length - 1, userInterfaceStyle: 'dark' },
        (i) => actions[i]?.[1](),
      );
    } else {
      Alert.alert(s.name, undefined, [...actions.slice(0, 2).map(([text, onPress]) => ({ text, onPress })), { text: 'Cancel', style: 'cancel' as const }]);
    }
  };

  return (
    <Screen>
      <Section title="Save current setup">
        <Card>
          <View style={styles.inline}>
            <View style={styles.flex}>
              <TextField value={name} onChangeText={setName} placeholder="e.g. Glen Helen baseline" returnKeyType="done" accessibilityLabel="Setup name" />
            </View>
            <Button
              label="Save"
              disabled={!name.trim()}
              onPress={async () => {
                await savedSetupRepository.save(bike.id, { name });
                setName('');
              }}
            />
          </View>
        </Card>
      </Section>

      <Section title={`Saved (${saved.length})`}>
        {saved.length === 0 ? (
          <Card>
            <Text variant="subhead" tone="tertiary">
              Save setups you like, such as a hard-pack or sand setup, and switch back to them later.
            </Text>
          </Card>
        ) : (
          <ListGroup>
            {saved.map((s) => (
              <ListRow
                key={s.id}
                icon={s.origin === 'autoBeforeRestore' ? 'time-outline' : 'bookmark-outline'}
                title={s.name}
                subtitle={`${ORIGIN[s.origin]} · ${new Date(s.createdAt).toLocaleDateString()}`}
                onPress={() => open(s)}
              />
            ))}
          </ListGroup>
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
