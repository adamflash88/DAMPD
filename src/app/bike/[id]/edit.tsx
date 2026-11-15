import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { UnitsEditor } from '../../../components/UnitsEditor';
import { Button, Card, EmptyState, Screen, Section, TextField } from '../../../components/ui';
import { bikeRepository, useBike, useSessions } from '../../../data';
import { findCatalogMatch } from '../../../domain/catalogMatch';
import type { Bike } from '../../../domain/types';

export default function EditBikeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bike = useBike(id);
  if (!bike) {
    return (
      <Screen>
        <EmptyState title="Motorcycle not found" />
      </Screen>
    );
  }
  return <EditForm bike={bike} />;
}

function EditForm({ bike }: { bike: Bike }) {
  const sessions = useSessions(bike.id);
  const [year, setYear] = useState(String(bike.year));
  const [make, setMake] = useState(bike.make);
  const [model, setModel] = useState(bike.model);
  const [nickname, setNickname] = useState(bike.nickname);
  const [units, setUnits] = useState(bike.units);
  const y = Number(year);
  const valid = Number.isInteger(y) && y >= 1950 && y <= 2100 && make.trim() && model.trim();

  const save = async () => {
    const identityChanged = make.trim() !== bike.make || model.trim() !== bike.model;
    await bikeRepository.updateDetails(bike.id, {
      year: y,
      make: make.trim(),
      model: model.trim(),
      nickname: nickname.trim(),
      catalogId: identityChanged ? (findCatalogMatch(make, model)?.id ?? null) : bike.catalogId,
    });
    await bikeRepository.updateUnits(bike.id, units);
    router.back();
  };

  const confirmDelete = () =>
    Alert.alert(
      'Delete motorcycle?',
      `This permanently deletes ${bike.year} ${bike.make} ${bike.model}, its ${sessions.length} session${sessions.length === 1 ? '' : 's'} and saved setups.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await bikeRepository.remove(bike.id);
            router.dismissAll();
          },
        },
      ],
    );

  return (
    <Screen footer={<Button label="Save" size="lg" onPress={save} disabled={!valid} />}>
      <Card>
        <TextField label="Year" value={year} onChangeText={(t) => setYear(t.replace(/[^0-9]/g, '').slice(0, 4))} keyboardType="number-pad" />
        <TextField label="Manufacturer" value={make} onChangeText={setMake} autoCapitalize="words" />
        <TextField label="Model" value={model} onChangeText={setModel} />
        <TextField label="Nickname (optional)" value={nickname} onChangeText={setNickname} placeholder="e.g. Race bike" />
      </Card>
      <Section title="Units">
        <Card>
          <UnitsEditor value={units} onChange={setUnits} />
        </Card>
      </Section>
      <Button label="Delete motorcycle" variant="danger" icon="trash-outline" block onPress={confirmDelete} />
    </Screen>
  );
}
