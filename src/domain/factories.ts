import { newId, nowISO, todayISODate } from './ids';
import { ADJUSTER_META } from './settings';
import { createSnapshot } from './setup';
import { DEFAULT_UNITS } from './units';
import type {
  Adjuster,
  AdjusterConvention,
  AdjusterKind,
  AdjusterMechanism,
  Bike,
  DisplayUnits,
  ForkSetup,
  RiderProfile,
  Session,
  ShockSetup,
  SuspensionSetup,
  TrackConditions,
  Value,
} from './types';

export const unknown = <T,>(): Value<T> => ({ value: null, source: 'unknown' });

export interface NewAdjusterInput {
  kind: AdjusterKind;
  label?: string;
  mechanism?: AdjusterMechanism;
  convention?: AdjusterConvention;
  step?: number;
}

export function createAdjuster(input: NewAdjusterInput): Adjuster {
  const mechanism = input.mechanism ?? 'clicks';
  return {
    id: input.kind === 'custom' ? newId() : input.kind,
    kind: input.kind,
    label: input.kind === 'custom' ? (input.label?.trim() || 'Custom adjuster') : ADJUSTER_META[input.kind].label,
    mechanism,
    convention: input.convention ?? 'outFromFullStiff',
    step: input.step ?? (mechanism === 'turns' ? 0.25 : 1),
    current: unknown(),
    range: unknown(),
  };
}

/** Typical layout for a modern MX bike: fork comp/reb; shock HSC/LSC/reb. */
export function defaultForkAdjusters(): Adjuster[] {
  return [createAdjuster({ kind: 'compression' }), createAdjuster({ kind: 'rebound' })];
}

export function defaultShockAdjusters(): Adjuster[] {
  return [
    createAdjuster({ kind: 'hsc', mechanism: 'turns', step: 0.25 }),
    createAdjuster({ kind: 'lsc' }),
    createAdjuster({ kind: 'rebound' }),
  ];
}

export function emptyForkSetup(): ForkSetup {
  return {
    hardware: { make: unknown(), model: unknown() },
    springType: 'coil',
    adjusters: defaultForkAdjusters(),
    measurements: {
      springRate: unknown(),
      airPressure: unknown(),
      forkHeight: unknown(),
      oilHeight: unknown(),
      oilVolume: unknown(),
      raceSag: unknown(),
    },
    modifications: [],
  };
}

export function emptyShockSetup(): ShockSetup {
  return {
    hardware: { make: unknown(), model: unknown() },
    adjusters: defaultShockAdjusters(),
    measurements: { springRate: unknown(), raceSag: unknown(), staticSag: unknown() },
    modifications: [],
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
  catalogId?: string | null;
  units?: DisplayUnits;
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
    catalogId: input.catalogId ?? null,
    units: { ...(input.units ?? DEFAULT_UNITS) },
    suspension: input.suspension ?? emptySetup(),
  };
}

export const EMPTY_CONDITIONS: TrackConditions = {
  dirtType: null,
  moisture: null,
  ruts: null,
  roughness: null,
  temperatureC: null,
  notes: '',
};

export function emptyRiderProfile(): RiderProfile {
  return { name: '', weightKg: null, skill: null, notes: '', updatedAt: null };
}

export interface StartSessionInput {
  trackName?: string;
  date?: string;
}

/** New session with a frozen snapshot of the bike's setup at this moment. */
export function createSession(bike: Bike, input: StartSessionInput = {}): Session {
  const now = nowISO();
  return {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    bikeId: bike.id,
    status: 'active',
    trackName: input.trackName?.trim() ?? '',
    date: input.date ?? todayISODate(),
    startedAt: now,
    endedAt: null,
    conditions: { ...EMPTY_CONDITIONS },
    snapshot: createSnapshot(bike, now),
    events: [],
    notes: '',
    legacyFeedback: null,
  };
}
