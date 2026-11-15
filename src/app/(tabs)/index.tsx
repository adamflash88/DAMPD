import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { IllustrativeBadge } from '../../components/IllustrativeBadge';
import { Card, EmptyState, Row, Screen, SectionHeader } from '../../components/Layout';
import { IllustrativeLegend, SetupSummary } from '../../components/Suspension';
import { useActiveBike, useActiveSessionForBike, useLastCompletedSession } from '../../data';
import { DIRT_TYPES, labelFor, MOISTURE_LEVELS, RUT_LEVELS } from '../../domain/labels';
import { bikeLabel, countUnverified } from '../../domain/setup';
import type { Session } from '../../domain/types';
import { spacing } from '../../theme/tokens';

export default function HomeScreen() {
  const bike = useActiveBike();
  const activeSession = useActiveSessionForBike(bike?.id);
  const lastSession = useLastCompletedSession(bike?.id);

  if (!bike) {
    return (
      <Screen>
        <AppText variant="display">DAMPD</AppText>
        <EmptyState
          title="No bike yet"
          body="Add a bike to your garage to start logging setups."
          action={<Button label="Add bike" icon="add" onPress={() => router.push('/bike/new')} />}
        />
      </Screen>
    );
  }

  const unverified = countUnverified(bike.suspension);

  return (
    <Screen>
      <View>
        <AppText variant="label" tone="accent">
          DAMPD
        </AppText>
        <AppText variant="display">Dashboard</AppText>
      </View>

      <Card level={2}>
        <AppText variant="label" tone="secondary">
          Active bike
        </AppText>
        <AppText variant="title">{bikeLabel(bike)}</AppText>
        <AppText variant="caption" tone="secondary">
          Sag {bike.units.sag} · Springs {bike.units.springRate} · Clickers counted out from full stiff
        </AppText>
        {unverified > 0 ? (
          <Row>
            <IllustrativeBadge compact />
            <AppText variant="caption" tone="secondary" style={{ flex: 1 }}>
              {unverified} value{unverified === 1 ? '' : 's'} not yet confirmed. Open the suspension profile to verify.
            </AppText>
          </Row>
        ) : null}
        <Button
          label={activeSession ? 'Resume session' : 'Start session'}
          icon="flag"
          size="large"
          onPress={() =>
            activeSession ? router.push(`/session/${activeSession.id}`) : router.push('/session')
          }
        />
      </Card>

      <SectionHeader
        title="Current setup"
        right={
          <Button
            label="Edit"
            variant="ghost"
            icon="create-outline"
            onPress={() => router.push(`/bike/${bike.id}/suspension`)}
          />
        }
      />
      <Card>
        <AppText variant="heading">Fork</AppText>
        <SetupSummary setup={bike.suspension} units={bike.units} end="fork" />
        <AppText variant="heading" style={styles.mt}>
          Shock
        </AppText>
        <SetupSummary setup={bike.suspension} units={bike.units} end="shock" />
        {unverified > 0 ? <IllustrativeLegend /> : null}
      </Card>

      <SectionHeader title="Last session" />
      {lastSession ? (
        <SessionSnapshotCard session={lastSession} />
      ) : (
        <EmptyState title="No sessions yet" body="Start a session at the track to snapshot this setup." />
      )}
    </Screen>
  );
}

function SessionSnapshotCard({ session }: { session: Session }) {
  const c = session.conditions;
  const overall = session.feedback.ratings.overall;
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <AppText variant="heading">{session.trackName || 'Untitled track'}</AppText>
          <AppText variant="caption" tone="secondary">
            {session.date} · {session.status === 'active' ? 'In progress' : 'Completed'}
          </AppText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText variant="valueLarge" tone="accent">
            {overall ?? '—'}
          </AppText>
          <AppText variant="caption" tone="secondary">
            overall / 5
          </AppText>
        </View>
      </Row>
      <AppText tone="secondary">
        {[labelFor(DIRT_TYPES, c.dirtType), labelFor(MOISTURE_LEVELS, c.moisture), `Ruts: ${labelFor(RUT_LEVELS, c.ruts)}`]
          .filter((s) => s !== '—')
          .join(' · ')}
        {c.temperature !== null ? ` · ${c.temperature}°${session.snapshot.units.temperature}` : ''}
      </AppText>
      <AppText variant="bodyStrong">
        <AppText variant="valueSmall" tone="accent">
          {session.adjustments.length}
        </AppText>{' '}
        adjustment{session.adjustments.length === 1 ? '' : 's'} made
      </AppText>
      <Button label="Open session" variant="secondary" onPress={() => router.push(`/session/${session.id}`)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  mt: { marginTop: spacing.sm },
});
