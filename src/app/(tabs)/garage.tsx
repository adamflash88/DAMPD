import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { IllustrativeBadge } from '../../components/IllustrativeBadge';
import { Card, EmptyState, Row, Screen } from '../../components/Layout';
import { bikeRepository, useActiveBikeId, useBikes } from '../../data';
import { bikeLabel, countUnverified } from '../../domain/setup';
import { colors, spacing } from '../../theme/tokens';

export default function GarageScreen() {
  const bikes = useBikes();
  const activeId = useActiveBikeId();

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <AppText variant="display">Garage</AppText>
        <Button label="Add bike" icon="add" variant="secondary" onPress={() => router.push('/bike/new')} />
      </Row>

      {bikes.length === 0 ? (
        <EmptyState title="Your garage is empty" body="Add a bike to start building its suspension profile." />
      ) : null}

      {bikes.map((bike) => {
        const active = bike.id === activeId;
        const unverified = countUnverified(bike.suspension);
        return (
          <Card key={bike.id} level={active ? 2 : 1} highlight={active}>
            <Row>
              <View style={{ flex: 1, gap: spacing.xs }}>
                {active ? (
                  <Row style={{ gap: spacing.xs }}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                    <AppText variant="label" tone="accent">
                      Active
                    </AppText>
                  </Row>
                ) : null}
                <AppText variant="title">{bikeLabel(bike)}</AppText>
                {unverified > 0 ? <IllustrativeBadge compact /> : null}
              </View>
            </Row>
            <Row style={{ flexWrap: 'wrap' }}>
              <Button
                label="Suspension"
                icon="options-outline"
                onPress={() => router.push(`/bike/${bike.id}/suspension`)}
                style={{ flexGrow: 1 }}
              />
              <Button
                label="Edit"
                icon="create-outline"
                variant="secondary"
                onPress={() => router.push(`/bike/${bike.id}/edit`)}
                style={{ flexGrow: 1 }}
              />
              {!active ? (
                <Button
                  label="Set active"
                  variant="secondary"
                  icon="radio-button-on-outline"
                  onPress={() => void bikeRepository.setActive(bike.id)}
                  style={{ flexGrow: 1 }}
                />
              ) : null}
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
