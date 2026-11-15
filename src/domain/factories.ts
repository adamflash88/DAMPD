import { newId, nowISO, todayISODate } from './ids';
import { createSnapshot } from './setup';
import type {
  Bike,
  BikeUnits,
  ForkSetup,
  RatingKey,
  RiderFeedback,
  Session,
  ShockSetup,
  Spec,
  SuspensionSetup,
  TrackConditions,
} from './types';

export const DEFAULT_UNITS: BikeUnits = {
  sag: 'mm',
  springRate: 'N/mm',
  length: 'mm',
  oilLevel: 'mm',
  temperature: 'C',
  clickerConvention: 'clicksOutFromFullStiff',
};

/** An empty, rider-entered value. Empty is not "illustrative": there's nothing to verify. */
export const empty = <T,>(): Spec<T> => ({ value: null, isVerified: true });

export function emptyForkSetup(): ForkSetup {
  return {
    make: empty(),
    model: empty(),
    modifications: [],
    settings: {
      springRate: empty(),
      compression: empty(),
      rebound: empty(),
      forkHeight: empty(),
      oilLevel: empty(),
      raceSag: empty(),
    },
    clickerRanges: { compression: empty(), rebound: empty() },
  };
}

export function emptyShockSetup(): ShockSetup {
  return {
    make: empty(),
    model: empty(),
    modifications: [],
    settings: {
      springRate: empty(),
      highSpeedCompression: empty(),
      lowSpeedCompression: empty(),
      rebound: empty(),
      raceSag: empty(),
      staticSag: empty(),
    },
    clickerRanges: { highSpeedCompression: empty(), lowSpeedCompression: empty(), rebound: empty() },
  };
}

export function emptySetup(): SuspensionSetup {
  return { fork: emptyForkSetup(), shock: emptyShockSetup() };
}

export interface NewBikeInput {
  year: number;
  make: string;
  model: string;
  nickname?: string;
  units?: BikeUnits;
  suspension?: SuspensionSetup;
}

export function createBike(input: NewBikeInput): Bike {
  const now = nowISO();
  return {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    year: input.year,
    make: input.make.trim(),
    model: input.model.trim(),
    nickname: input.nickname?.trim() ?? '',
    units: { ...(input.units ?? DEFAULT_UNITS) },
    suspension: input.suspension ?? emptySetup(),
  };
}

export const EMPTY_CONDITIONS: TrackConditions = {
  dirtType: null,
  moisture: null,
  ruts: null,
  temperature: null,
};

export function emptyFeedback(): RiderFeedback {
  const keys: RatingKey[] = [
    'overall',
    'frontEnd',
    'rearEnd',
    'bottoming',
    'harshness',
    'cornering',
    'straightLineStability',
  ];
  return {
    ratings: Object.fromEntries(keys.map((k) => [k, null])) as RiderFeedback['ratings'],
    notes: '',
  };
}

export interface StartSessionInput {
  trackName: string;
  date?: string;
  conditions?: Partial<TrackConditions>;
}

/** New session with a frozen snapshot of the bike's setup at this moment. */
export function createSession(bike: Bike, input: StartSessionInput): Session {
  const now = nowISO();
  return {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    bikeId: bike.id,
    status: 'active',
    trackName: input.trackName.trim(),
    date: input.date ?? todayISODate(),
    conditions: { ...EMPTY_CONDITIONS, ...input.conditions },
    feedback: emptyFeedback(),
    snapshot: createSnapshot(bike, now),
    adjustments: [],
  };
}
