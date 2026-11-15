/**
 * Structured tuning context: groundwork for future diagnostics.
 *
 * `buildTuningContext` gathers everything known about a bike's setup and
 * history into one plain, serializable object (no React, no storage). A
 * future diagnostics provider (AI or otherwise) would consume this instead of
 * reaching into app state. Nothing in this build produces recommendations,
 * and nothing here is AI.
 */
import { applyAdjustments, bikeName } from './setup';
import type {
  AdjustmentEvent,
  Bike,
  RiderProfile,
  Session,
  SuspensionSetup,
  TestRunEvent,
  TrackConditions,
} from './types';

export interface SessionContext {
  sessionId: string;
  date: string;
  trackName: string;
  conditions: TrackConditions;
  startingSetup: SuspensionSetup;
  endingSetup: SuspensionSetup;
  adjustments: AdjustmentEvent[];
  testRuns: TestRunEvent[];
}

export interface TuningContext {
  schema: 'dampd.tuning-context/1';
  generatedAt: string;
  rider: RiderProfile;
  bike: {
    id: string;
    name: string;
    nickname: string;
    units: Bike['units'];
    currentSetup: SuspensionSetup;
  };
  sessions: SessionContext[];
}

export function buildTuningContext(
  bike: Bike,
  sessions: readonly Session[],
  rider: RiderProfile,
  now: string = new Date().toISOString(),
): TuningContext {
  const ordered = sessions
    .filter((s) => s.bikeId === bike.id)
    .slice()
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  return JSON.parse(
    JSON.stringify({
      schema: 'dampd.tuning-context/1',
      generatedAt: now,
      rider,
      bike: { id: bike.id, name: bikeName(bike), nickname: bike.nickname, units: bike.units, currentSetup: bike.suspension },
      sessions: ordered.map((s) => ({
        sessionId: s.id,
        date: s.date,
        trackName: s.trackName,
        conditions: s.conditions,
        startingSetup: s.snapshot.setup,
        endingSetup: applyAdjustments(s.snapshot.setup, s.events),
        adjustments: s.events.filter((e) => e.type === 'adjustment'),
        testRuns: s.events.filter((e) => e.type === 'testRun'),
      })),
    }),
  ) as TuningContext;
}

/**
 * Contract a future diagnostics feature would implement. There is
 * intentionally no implementation in this build.
 */
export interface DiagnosticsProvider {
  readonly id: string;
  analyze(context: TuningContext): Promise<unknown>;
}
