/**
 * Versioned persisted schema + migrations.
 *
 * To change the persisted shape:
 *  1. Bump SCHEMA_VERSION.
 *  2. Add migrations[n] that upgrades a state persisted at version n.
 *  3. Add tests in __tests__/migrations.test.ts.
 *
 * Migrations never drop user data. Fields that have no v2 equivalent are kept
 * (e.g. v1 ratings in Session.legacyFeedback).
 */
import { findCatalogMatch } from '../domain/catalogMatch';
import { emptyRiderProfile, EMPTY_CONDITIONS } from '../domain/factories';
import { newId } from '../domain/ids';
import type * as V1 from '../domain/legacy/v1';
import type {
  Adjuster,
  AdjustmentEvent,
  Bike,
  DisplayUnits,
  RiderProfile,
  SavedSetup,
  Session,
  SettingPath,
  SuspensionSetup,
  Value,
} from '../domain/types';
import { legacyToCanonical } from '../domain/units';

export const SCHEMA_VERSION = 2;

export interface PersistedStateV2 {
  bikes: Record<string, Bike>;
  sessions: Record<string, Session>;
  savedSetups: Record<string, SavedSetup>;
  activeBikeId: string | null;
  rider: RiderProfile;
}

export type PersistedState = PersistedStateV2;

interface PersistedStateV1 {
  bikes: Record<string, V1.Bike>;
  sessions: Record<string, V1.Session>;
  activeBikeId: string | null;
}

// ---------------------------------------------------------------------------
// v1 → v2
// ---------------------------------------------------------------------------

function v(spec: V1.Spec<number> | V1.Spec<string> | undefined, convert?: (n: number) => number): Value<never> {
  if (!spec || spec.value === null || spec.value === undefined) return { value: null, source: 'unknown' };
  const value = typeof spec.value === 'number' && convert ? convert(spec.value) : spec.value;
  return { value, source: spec.isVerified ? 'user' : 'demo' } as unknown as Value<never>;
}

function convertUnits(u: V1.BikeUnits): DisplayUnits {
  return {
    length: u.sag === 'in' ? 'in' : 'mm',
    springRate: u.springRate === 'kg/mm' ? 'kgf/mm' : 'N/mm',
    temperature: u.temperature === 'F' ? 'F' : 'C',
  };
}

function v1Adjuster(
  kind: Adjuster['kind'],
  label: string,
  current: V1.Spec<number> | undefined,
  range: V1.Spec<number> | undefined,
  u: V1.BikeUnits,
): Adjuster {
  return {
    id: kind,
    kind,
    label,
    mechanism: 'clicks', // v1 recorded every adjuster as integer clicks
    convention: u.clickerConvention === 'clicksInFromFullSoft' ? 'inFromFullSoft' : 'outFromFullStiff',
    step: 1,
    current: v(current),
    range: v(range),
  };
}

function convertSetup(s: V1.SuspensionSetup, u: V1.BikeUnits): SuspensionSetup {
  const len = (n: number) => legacyToCanonical('length', n, u.sag);
  const rate = (n: number) => legacyToCanonical('springRate', n, u.springRate);
  const oil = s.fork.settings.oilLevel;
  const stamp = new Date(0).toISOString();
  const mods = (list: string[]) => list.map((description) => ({ id: newId(), description, addedAt: stamp }));
  return {
    fork: {
      hardware: { make: v(s.fork.make), model: v(s.fork.model) },
      springType: 'coil',
      adjusters: [
        v1Adjuster('compression', 'Compression', s.fork.settings.compression, s.fork.clickerRanges.compression, u),
        v1Adjuster('rebound', 'Rebound', s.fork.settings.rebound, s.fork.clickerRanges.rebound, u),
      ],
      measurements: {
        springRate: v(s.fork.settings.springRate, rate),
        airPressure: { value: null, source: 'unknown' },
        forkHeight: v(s.fork.settings.forkHeight),
        // v1 kept one "oil level" field whose meaning depended on the unit toggle.
        oilHeight: u.oilLevel === 'mm' ? v(oil) : { value: null, source: 'unknown' },
        oilVolume: u.oilLevel === 'cc' ? v(oil) : { value: null, source: 'unknown' },
        raceSag: v(s.fork.settings.raceSag, len),
      },
      modifications: mods(s.fork.modifications),
    },
    shock: {
      hardware: { make: v(s.shock.make), model: v(s.shock.model) },
      adjusters: [
        v1Adjuster('hsc', 'High-speed compression', s.shock.settings.highSpeedCompression, s.shock.clickerRanges.highSpeedCompression, u),
        v1Adjuster('lsc', 'Low-speed compression', s.shock.settings.lowSpeedCompression, s.shock.clickerRanges.lowSpeedCompression, u),
        v1Adjuster('rebound', 'Rebound', s.shock.settings.rebound, s.shock.clickerRanges.rebound, u),
      ],
      measurements: {
        springRate: v(s.shock.settings.springRate, rate),
        raceSag: v(s.shock.settings.raceSag, len),
        staticSag: v(s.shock.settings.staticSag, len),
      },
      modifications: mods(s.shock.modifications),
    },
  };
}

const V1_PATHS: Record<string, { path: SettingPath; q?: 'length' | 'springRate' }> = {
  'fork.springRate': { path: 'fork.m.springRate', q: 'springRate' },
  'fork.compression': { path: 'fork.adj.compression' },
  'fork.rebound': { path: 'fork.adj.rebound' },
  'fork.forkHeight': { path: 'fork.m.forkHeight' },
  'fork.raceSag': { path: 'fork.m.raceSag', q: 'length' },
  'shock.springRate': { path: 'shock.m.springRate', q: 'springRate' },
  'shock.highSpeedCompression': { path: 'shock.adj.hsc' },
  'shock.lowSpeedCompression': { path: 'shock.adj.lsc' },
  'shock.rebound': { path: 'shock.adj.rebound' },
  'shock.raceSag': { path: 'shock.m.raceSag', q: 'length' },
  'shock.staticSag': { path: 'shock.m.staticSag', q: 'length' },
};

function convertAdjustment(a: V1.Adjustment, u: V1.BikeUnits): AdjustmentEvent {
  let target = V1_PATHS[a.setting];
  if (a.setting === 'fork.oilLevel') target = { path: u.oilLevel === 'cc' ? 'fork.m.oilVolume' : 'fork.m.oilHeight' };
  const conv = (n: number) =>
    target?.q === 'length' ? legacyToCanonical('length', n, u.sag) : target?.q === 'springRate' ? legacyToCanonical('springRate', n, u.springRate) : n;
  return {
    type: 'adjustment',
    id: a.id,
    at: a.createdAt,
    path: target?.path ?? (`${a.setting.split('.')[0] === 'shock' ? 'shock' : 'fork'}.m.${a.setting.split('.')[1] ?? 'unknown'}` as SettingPath),
    before: a.before === null ? null : conv(a.before),
    after: conv(a.after),
    reason: a.reason,
  };
}

function convertSession(s: V1.Session): Session {
  const u = s.snapshot.units;
  const ratings = s.feedback?.ratings ?? {};
  const hasRatings = Object.values(ratings).some((r) => r !== null);
  const notes = s.feedback?.notes ?? '';
  const t = s.conditions.temperature;
  return {
    id: s.id,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    bikeId: s.bikeId,
    status: s.status,
    trackName: s.trackName,
    date: s.date,
    startedAt: s.snapshot.capturedAt ?? s.createdAt,
    endedAt: s.status === 'completed' ? s.updatedAt : null,
    conditions: {
      ...EMPTY_CONDITIONS,
      dirtType: s.conditions.dirtType,
      moisture: s.conditions.moisture,
      ruts: s.conditions.ruts,
      temperatureC: t === null ? null : u.temperature === 'F' ? ((t - 32) * 5) / 9 : t,
    },
    snapshot: {
      capturedAt: s.snapshot.capturedAt,
      bikeLabel: s.snapshot.bikeLabel,
      units: convertUnits(u),
      setup: convertSetup(s.snapshot.setup, u),
    },
    events: s.adjustments.map((a) => convertAdjustment(a, u)),
    notes,
    legacyFeedback: hasRatings || notes ? { ratings: { ...ratings }, notes } : null,
  };
}

function convertBike(b: V1.Bike): Bike {
  return {
    id: b.id,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    year: b.year,
    make: b.make,
    model: b.model,
    nickname: b.nickname,
    catalogId: findCatalogMatch(b.make, b.model)?.id ?? null,
    units: convertUnits(b.units),
    suspension: convertSetup(b.suspension, b.units),
  };
}

export function migrateV1toV2(state: PersistedStateV1): PersistedStateV2 {
  const bikes = Object.fromEntries(Object.values(state.bikes ?? {}).map((b) => [b.id, convertBike(b)]));
  const sessions = Object.fromEntries(Object.values(state.sessions ?? {}).map((s) => [s.id, convertSession(s)]));
  return { bikes, sessions, savedSetups: {}, activeBikeId: state.activeBikeId ?? null, rider: emptyRiderProfile() };
}

// ---------------------------------------------------------------------------

type Migration = (state: unknown) => unknown;

/** migrations[n] upgrades a state persisted at version n to version n + 1. */
export const migrations: Record<number, Migration> = {
  1: (s) => migrateV1toV2(s as PersistedStateV1),
};

export function migratePersistedState(persisted: unknown, fromVersion: number): PersistedState {
  if (fromVersion > SCHEMA_VERSION) {
    // Data written by a newer app build. Don't guess; keep it as-is.
    return persisted as PersistedState;
  }
  let state = persisted;
  for (let ver = fromVersion; ver < SCHEMA_VERSION; ver++) {
    const step = migrations[ver];
    if (!step) throw new Error(`Missing migration from schema v${ver} to v${ver + 1}`);
    state = step(state);
  }
  return state as PersistedState;
}
