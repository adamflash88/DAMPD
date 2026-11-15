import { router } from 'expo-router';

import { Button, EmptyState, IconButton, ListGroup, ListRow, Screen, ScreenHeader, Section } from '../../components/ui';
import { useActiveBikeId, useBikes, useSessions } from '../../data';
import { bikeName, setupStatus } from '../../domain/setup';

const STATUS_TEXT = { complete: 'Setup complete', partial: 'Setup partial', notConfigured: 'Setup not configured' } as const;

export default function GarageScreen() {
  const bikes = useBikes();
  const activeId = useActiveBikeId();
  const sessions = useSessions();

  return (
    <Screen kind="tab">
      <ScreenHeader
        title="Garage"
        subtitle={`${bikes.length} motorcycle${bikes.length === 1 ? '' : 's'}`}
        right={<IconButton icon="add" tone="accent" accessibilityLabel="Add motorcycle" onPress={() => router.push('/bike/new')} />}
      />

      {bikes.length === 0 ? (
        <EmptyState
          title="Your garage is empty"
          body="Add a motorcycle to build its suspension profile."
          action={<Button label="Add motorcycle" icon="add" onPress={() => router.push('/bike/new')} />}
        />
      ) : (
        <Section>
          <ListGroup>
            {bikes.map((b) => {
              const count = sessions.filter((s) => s.bikeId === b.id).length;
              return (
                <ListRow
                  key={b.id}
                  icon={b.id === activeId ? 'checkmark-circle' : 'ellipse-outline'}
                  title={bikeName(b)}
                  subtitle={[b.nickname ? `“${b.nickname}”` : null, STATUS_TEXT[setupStatus(b.suspension)], `${count} session${count === 1 ? '' : 's'}`]
                    .filter(Boolean)
                    .join(' · ')}
                  value={b.id === activeId ? 'Active' : undefined}
                  valueTone="accent"
                  onPress={() => router.push(`/bike/${b.id}`)}
                />
              );
            })}
          </ListGroup>
        </Section>
      )}

      {bikes.length > 0 ? (
        <Button label="Add motorcycle" icon="add" variant="secondary" block onPress={() => router.push('/bike/new')} />
      ) : null}
    </Screen>
  );
}
