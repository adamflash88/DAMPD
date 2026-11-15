import { router } from 'expo-router';

import { BikeForm } from '../../components/BikeForm';
import { Screen } from '../../components/Layout';
import { bikeRepository } from '../../data';

export default function NewBikeScreen() {
  return (
    <Screen edges={['bottom']}>
      <BikeForm
        submitLabel="Add bike"
        onSubmit={async (values) => {
          const bike = await bikeRepository.create(values);
          router.replace(`/bike/${bike.id}/suspension`);
        }}
      />
    </Screen>
  );
}
