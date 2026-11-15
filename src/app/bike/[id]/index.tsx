import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SessionCard } from '../../../components/session/SessionCard';
import { DemoLegend, SetupSummary } from '../../../components/suspension/SetupSummary';
import { Button, Card, EmptyState, ListGroup, ListRow, Screen, Section, StatusPill, Text, TextLink } from '../../../components/ui';
import { bikeRepository, useActiveBikeId, useBike, useSavedSetups, useSessions } from '../../../data';
import { findCatalogModel } from '../../../domain/catalog';
import { bikeName, countBySource, setupStatus } from '../../../domain/setup';
import { colors, spacing } from '../../../theme/tokens';

export default function BikeProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bike = useBike(id);
  const activeId = useActiveBikeId();
  const sessions = useSessions(id);
  const saved = useSavedSetups(id);

  if (!bike) {
    return (
      <Screen>
        <EmptyState title="Motorcycle not found" />
      </Screen>
    );
  }

  const isActive = bike.id === activeId;
  const s = bike.suspension;
  const hw = (end: 'fork' | 'shock') =>
    [s[end].hardware.make.value, s[end].hardware.model.value].filter(Boolean).join(' ') || 'Hardware not set';
  const mods = [...s.fork.modifications.map((m) => ({ ...m, end: 'Fork' })), ...s.shock.modifications.map((m) => ({ ...m, end: 'Shock' }))];

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: bike.nickname || bike.model,
          headerRight: () => <TextLink label="Edit" onPress={() => router.push(`/bike/${bike.id}/edit`)} />,
        }}
      />

      <Card variant="raised" style={styles.head}>
        <View style={styles.headRow}>
          <View style={styles.flex}>
            <Text variant="title">{bikeName(bike)}</Text>
            <Text variant="subhead" tone="secondary">
              {[bike.nickname ? `“${bike.nickname}”` : null, findCatalogModel(bike.catalogId) ? 'Demo catalog' : 'Manual entry'].filter(Boolean).join(' · ')}
            </Text>
          </View>
          {isActive ? (
            <View style={styles.activeTag}>
              <Text variant="overline" tone="onAccent">
                Active
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.headRow}>
          <StatusPill status={setupStatus(s)} />
          {!isActive ? (
            <Button label="Make active" size="sm" variant="secondary" onPress={() => void bikeRepository.setActive(bike.id)} />
          ) : null}
        </View>
      </Card>

      <Section title="Suspension">
        <ListGroup>
          <ListRow icon="git-commit-outline" title="Fork" subtitle={hw('fork')} onPress={() => router.push({ pathname: '/bike/[id]/suspension', params: { id: bike.id, end: 'fork' } })} />
          <ListRow icon="git-commit-outline" title="Shock" subtitle={hw('shock')} onPress={() => router.push({ pathname: '/bike/[id]/suspension', params: { id: bike.id, end: 'shock' } })} />
          <ListRow
            icon="bookmark-outline"
            title="Saved setups"
            value={String(saved.length)}
            onPress={() => router.push(`/bike/${bike.id}/setups`)}
          />
        </ListGroup>
      </Section>

      <Section title="Current settings" action={<TextLink label="Edit" onPress={() => router.push(`/bike/${bike.id}/suspension`)} />}>
        <Card>
          <SetupSummary setup={s} units={bike.units} />
          {countBySource(s).demo > 0 ? <DemoLegend /> : null}
        </Card>
      </Section>

      <Section title="Modifications">
        {mods.length === 0 ? (
          <Card>
            <Text variant="subhead" tone="tertiary">
              None recorded
            </Text>
          </Card>
        ) : (
          <ListGroup>
            {mods.map((m) => (
              <ListRow key={m.id} title={m.description} subtitle={m.end} />
            ))}
          </ListGroup>
        )}
      </Section>

      <Section title="Recent sessions" action={sessions.length > 3 ? <TextLink label="All" onPress={() => router.push('/history')} /> : undefined}>
        {sessions.length === 0 ? (
          <Card>
            <Text variant="subhead" tone="tertiary">
              No sessions yet
            </Text>
          </Card>
        ) : (
          sessions.slice(0, 3).map((x) => <SessionCard key={x.id} session={x} onPress={() => router.push(`/session/${x.id}`)} />)
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { gap: spacing.md },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  activeTag: { backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 3 },
});
