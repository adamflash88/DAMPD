import { router } from 'expo-router';

import { Button, ListGroup, ListRow, Screen, Text } from '../../components/ui';
import { bikeRepository, useActiveBikeId, useBikes } from '../../data';
import { bikeName } from '../../domain/setup';

export default function SwitchBikeScreen() {
  const bikes = useBikes();
  const activeId = useActiveBikeId();
  return (
    <Screen>
      <Text variant="subhead" tone="secondary">
        Sessions stay with each motorcycle. Switching only changes which bike Home and Tune use.
      </Text>
      <ListGroup>
        {bikes.map((b) => (
          <ListRow
            key={b.id}
            icon={b.id === activeId ? 'radio-button-on' : 'radio-button-off'}
            title={bikeName(b)}
            subtitle={b.nickname || undefined}
            value={b.id === activeId ? 'Active' : undefined}
            valueTone="accent"
            chevron={false}
            onPress={async () => {
              await bikeRepository.setActive(b.id);
              router.back();
            }}
          />
        ))}
      </ListGroup>
      <Button label="Add motorcycle" icon="add" variant="secondary" block onPress={() => router.replace('/bike/new')} />
    </Screen>
  );
}
