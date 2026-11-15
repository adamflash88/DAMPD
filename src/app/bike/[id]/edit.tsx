import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import { BikeForm } from '../../../components/BikeForm';
import { Button } from '../../../components/Button';
import { EmptyState, Screen } from '../../../components/Layout';
import { bikeRepository, useBike, useSessionsForBike } from '../../../data';

export default function EditBikeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bike = useBike(id);
  const sessions = useSessionsForBike(id);

  if (!bike) {
    return (
      <Screen edges={['bottom']}>
        <EmptyState title="Bike not found" />
      </Screen>
    );
  }

  const confirmDelete = () =>
    Alert.alert(
      'Delete bike?',
      `This permanently deletes ${bike.make} ${bike.model} and its ${sessions.length} session${sessions.length === 1 ? '' : 's'}.`,
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
    <Screen edges={['bottom']}>
      <BikeForm
        initial={{
          year: String(bike.year),
          make: bike.make,
          model: bike.model,
          nickname: bike.nickname,
          units: bike.units,
        }}
        submitLabel="Save"
        onSubmit={async ({ units, ...details }) => {
          await bikeRepository.updateDetails(bike.id, details);
          await bikeRepository.updateUnits(bike.id, units);
          router.back();
        }}
      />
      <Button label="Delete bike" variant="danger" icon="trash-outline" onPress={confirmDelete} />
    </Screen>
  );
}
