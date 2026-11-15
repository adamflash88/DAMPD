import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SessionCard } from '../../components/session/SessionCard';
import { DemoLegend, SetupSummary } from '../../components/suspension/SetupSummary';
import { Button, Card, EmptyState, IconButton, Notice, Screen, Section, StatusPill, Text, TextLink } from '../../components/ui';
import { useActiveBike, useActiveSession, useSessions } from '../../data';
import { formatDuration, sessionTitle, summarizeSession } from '../../domain/session';
import { bikeName, countBySource, setupStatus } from '../../domain/setup';
import { colors, spacing } from '../../theme/tokens';
import { useNow } from '../../hooks/useNow';

export default function HomeScreen() {
  const bike = useActiveBike();
  const active = useActiveSession(bike?.id);
  const recent = useSessions(bike?.id ?? null)[0];
  const now = useNow(active ? 30_000 : null);

  if (!bike) {
    return (
      <Screen kind="tab">
        <Header />
        <EmptyState
          title="Add your first motorcycle"
          body="Pick your bike to start tracking suspension settings and tuning sessions."
          action={<Button label="Add motorcycle" icon="add" onPress={() => router.push('/bike/new')} />}
        />
      </Screen>
    );
  }

  const status = setupStatus(bike.suspension);
  const demo = countBySource(bike.suspension).demo;
  const hardware = [bike.suspension.fork.hardware.make.value, bike.suspension.shock.hardware.make.value]
    .filter(Boolean)
    .join(' / ');
  const activeSum = active ? summarizeSession(active) : null;

  return (
    <Screen kind="tab">
      <Header />

      <Card variant="raised" style={styles.bikeCard}>
        <View style={styles.bikeTop}>
          <View style={styles.flex}>
            <Text variant="overline" tone="tertiary">
              Active motorcycle
            </Text>
            <Text variant="title" numberOfLines={1}>
              {bikeName(bike)}
            </Text>
            <Text variant="subhead" tone="secondary" numberOfLines={1}>
              {[bike.nickname ? `“${bike.nickname}”` : null, hardware || null].filter(Boolean).join(' · ') || 'Suspension not set up yet'}
            </Text>
          </View>
          <Button label="Switch" size="sm" variant="secondary" icon="swap-horizontal" onPress={() => router.push('/bike/switch')} />
        </View>
        <View style={styles.bikeMeta}>
          <StatusPill status={status} />
          <TextLink label="Profile" onPress={() => router.push(`/bike/${bike.id}`)} />
        </View>
      </Card>

      <View style={styles.cta}>
        <Button
          label={active ? 'CONTINUE SESSION' : 'START TUNING'}
          icon={active ? 'play' : 'flag'}
          size="lg"
          onPress={() => (active ? router.push(`/session/${active.id}`) : router.push('/tune'))}
        />
        {active && activeSum ? (
          <Text variant="caption" tone="secondary" align="center">
            {sessionTitle(active)} · {formatDuration(active.startedAt, now)} · {activeSum.testRuns} runs · {activeSum.adjustments} changes
          </Text>
        ) : null}
      </View>

      <Section title="Current setup" action={<TextLink label="Full profile" onPress={() => router.push(`/bike/${bike.id}/suspension`)} />}>
        <Card>
          <SetupSummary setup={bike.suspension} units={bike.units} />
          {demo > 0 ? <DemoLegend /> : null}
        </Card>
        {status === 'notConfigured' ? (
          <Notice
            tone="neutral"
            title="Add your clicker settings"
            body="You can start tuning now. Adding your current settings lets DAMPD show what changed."
            action={<TextLink label="Set up suspension" onPress={() => router.push(`/bike/${bike.id}/suspension`)} />}
          />
        ) : null}
      </Section>

      <Section title="Recent activity" action={recent ? <TextLink label="History" onPress={() => router.push('/history')} /> : undefined}>
        {recent ? (
          <SessionCard session={recent} onPress={() => router.push(`/session/${recent.id}`)} />
        ) : (
          <EmptyState title="No sessions yet" body="Start a session at the track to log feedback and adjustments." />
        )}
      </Section>
    </Screen>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Text variant="largeTitle" accessibilityRole="header" accessibilityLabel="DAMPD">
        DAMP<Text variant="largeTitle" tone="accent">D</Text>
      </Text>
      <IconButton icon="person-circle-outline" accessibilityLabel="Rider profile" onPress={() => router.push('/settings')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bikeCard: { gap: spacing.md },
  bikeTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  bikeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm + 2,
  },
  cta: { gap: spacing.sm, marginTop: -spacing.xs },
});
