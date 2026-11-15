import AsyncStorage from '@react-native-async-storage/async-storage';

import { migratePersistedState, SCHEMA_VERSION } from '../src/data/migrations';
import { getState, initialState, STORAGE_KEY, useDataStore } from '../src/data/zustand/store';
import { getSettingValue } from '../src/domain/settings';
import { N_PER_KGF } from '../src/domain/units';

/** A v1 state as the 0.1 app persisted it: one bike, one session with an adjustment. */
function v1Fixture() {
  const spec = (value: number | string | null, isVerified: boolean) => ({ value, isVerified });
  const setup = {
    fork: {
      make: spec('Showa', false),
      model: spec('Coil-spring fork', false),
      modifications: ['Stiffer springs'],
      settings: {
        springRate: spec(0.5, true), // kg/mm, rider-entered
        compression: spec(10, false),
        rebound: spec(9, true),
        forkHeight: spec(5, false),
        oilLevel: spec(330, true), // cc (bike used cc)
        raceSag: spec(null, true),
      },
      clickerRanges: { compression: spec(20, false), rebound: spec(20, false) },
    },
    shock: {
      make: spec('Showa', false),
      model: spec('Rear shock', false),
      modifications: [],
      settings: {
        springRate: spec(5.3, true),
        highSpeedCompression: spec(2, false),
        lowSpeedCompression: spec(10, false),
        rebound: spec(10, false),
        raceSag: spec(4.1, true), // inches
        staticSag: spec(null, true),
      },
      clickerRanges: { highSpeedCompression: spec(4, false), lowSpeedCompression: spec(20, false), rebound: spec(20, false) },
    },
  };
  const units = { sag: 'in', springRate: 'kg/mm', length: 'mm', oilLevel: 'cc', temperature: 'F', clickerConvention: 'clicksOutFromFullStiff' };
  return {
    bikes: {
      b1: { id: 'b1', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z', year: 2026, make: 'Kawasaki', model: 'KX250', nickname: 'Race', units, suspension: setup },
    },
    sessions: {
      s1: {
        id: 's1',
        createdAt: '2026-01-03T10:00:00.000Z',
        updatedAt: '2026-01-03T12:00:00.000Z',
        bikeId: 'b1',
        status: 'completed',
        trackName: 'Glen Helen',
        date: '2026-01-03',
        conditions: { dirtType: 'loam', moisture: 'tacky', ruts: 'light', temperature: 68 },
        feedback: { ratings: { overall: 4, frontEnd: null }, notes: 'Felt good' },
        snapshot: { capturedAt: '2026-01-03T10:00:00.000Z', bikeLabel: 'Race · 2026 Kawasaki KX250', units, setup },
        adjustments: [
          { id: 'a1', createdAt: '2026-01-03T11:00:00.000Z', updatedAt: '2026-01-03T11:00:00.000Z', setting: 'shock.raceSag', before: 4.1, after: 4.0, reason: 'Sag check' },
          { id: 'a2', createdAt: '2026-01-03T11:30:00.000Z', updatedAt: '2026-01-03T11:30:00.000Z', setting: 'fork.oilLevel', before: 330, after: 340, reason: '' },
        ],
      },
    },
    activeBikeId: 'b1',
  };
}

describe('migration v1 → v2', () => {
  const v2 = migratePersistedState(v1Fixture(), 1);
  const bike = v2.bikes.b1!;
  const session = v2.sessions.s1!;

  it('keeps every bike and session with ids and timestamps', () => {
    expect(Object.keys(v2.bikes)).toEqual(['b1']);
    expect(Object.keys(v2.sessions)).toEqual(['s1']);
    expect(bike.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(v2.activeBikeId).toBe('b1');
    expect(v2.savedSetups).toEqual({});
  });

  it('maps isVerified onto distinct provenance (demo/user/unknown, never manufacturer)', () => {
    expect(getSettingValue(bike.suspension, 'fork.adj.compression')?.source).toBe('demo');
    expect(getSettingValue(bike.suspension, 'fork.adj.rebound')?.source).toBe('user');
    expect(getSettingValue(bike.suspension, 'fork.m.raceSag')).toEqual({ value: null, source: 'unknown' });
    expect(JSON.stringify(v2)).not.toContain('"manufacturer"');
  });

  it('converts stored values to canonical units', () => {
    expect(getSettingValue(bike.suspension, 'fork.m.springRate')?.value).toBeCloseTo(0.5 * N_PER_KGF);
    expect(getSettingValue(bike.suspension, 'shock.m.raceSag')?.value).toBeCloseTo(4.1 * 25.4);
    expect(bike.units).toEqual({ length: 'in', springRate: 'kgf/mm', temperature: 'F' });
    expect(session.conditions.temperatureC).toBeCloseTo(20);
  });

  it('routes v1 "oil level" to oil volume when the bike used cc (never to height)', () => {
    expect(getSettingValue(bike.suspension, 'fork.m.oilVolume')?.value).toBe(330);
    expect(getSettingValue(bike.suspension, 'fork.m.oilHeight')?.value).toBeNull();
    expect(session.events[1]).toMatchObject({ type: 'adjustment', path: 'fork.m.oilVolume', before: 330, after: 340 });
  });

  it('converts adjustments to timeline events in canonical units', () => {
    expect(session.events[0]).toMatchObject({ type: 'adjustment', id: 'a1', path: 'shock.m.raceSag', reason: 'Sag check' });
    const e = session.events[0]!;
    if (e.type !== 'adjustment') throw new Error('expected adjustment');
    expect(e.before).toBeCloseTo(4.1 * 25.4);
    expect(e.after).toBeCloseTo(4.0 * 25.4);
  });

  it('preserves v1 ratings and notes verbatim', () => {
    expect(session.legacyFeedback).toEqual({ ratings: { overall: 4, frontEnd: null }, notes: 'Felt good' });
    expect(session.notes).toBe('Felt good');
    expect(session.endedAt).toBe('2026-01-03T12:00:00.000Z');
  });

  it('keeps modifications and matches the demo catalog', () => {
    expect(bike.suspension.fork.modifications.map((m) => m.description)).toEqual(['Stiffer springs']);
    expect(bike.catalogId).toBe('kawasaki-kx250');
  });
});

describe('migration plumbing', () => {
  it('passes through current-version state and refuses gaps', () => {
    const s = initialState();
    expect(migratePersistedState(s, SCHEMA_VERSION)).toBe(s);
    expect(() => migratePersistedState({}, 0)).toThrow(/Missing migration/);
  });

  it('migrates a real v1 blob from AsyncStorage on launch (same storage key)', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ state: v1Fixture(), version: 1 }));
    await useDataStore.persist.rehydrate();
    expect(getState().bikes.b1?.nickname).toBe('Race');
    expect(getState().sessions.s1?.events).toHaveLength(2);
    const stored = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!);
    expect(stored.version).toBe(SCHEMA_VERSION);
  });
});
