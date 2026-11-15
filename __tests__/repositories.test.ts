import AsyncStorage from '@react-native-async-storage/async-storage';

import { bikeRepository, riderRepository, savedSetupRepository, sessionRepository } from '../src/data';
import { getState, initialState, setState, STORAGE_KEY, useDataStore } from '../src/data/zustand/store';
import { getSettingValue } from '../src/domain/settings';
import { withSettingValue } from '../src/domain/setup';

beforeEach(() => {
  setState(initialState(), true);
});

const activeBike = () => getState().bikes[getState().activeBikeId!]!;

describe('sessions', () => {
  it('starts with only a bike: track optional, date auto-filled', async () => {
    const s = await sessionRepository.start(activeBike().id);
    expect(s.trackName).toBe('');
    expect(s.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(s.status).toBe('active');
  });

  it('keeps the starting snapshot when the garage profile changes', async () => {
    const bike = activeBike();
    const s = await sessionRepository.start(bike.id, { trackName: 'Track' });
    await bikeRepository.updateSuspension(bike.id, withSettingValue(bike.suspension, 'fork.adj.compression', 1));
    expect(getSettingValue(getState().sessions[s.id]!.snapshot.setup, 'fork.adj.compression')?.value).toBe(10);
  });

  it('records adjustments with derived before values and validates them', async () => {
    const s = await sessionRepository.start(activeBike().id);
    const a1 = await sessionRepository.addAdjustment(s.id, { path: 'shock.adj.rebound', after: 12, reason: 'Kicking' });
    const a2 = await sessionRepository.addAdjustment(s.id, { path: 'shock.adj.rebound', after: 14, reason: '' });
    expect(a1).toMatchObject({ before: 10, after: 12 });
    expect(a2).toMatchObject({ before: 12, after: 14 });
    // HSC is in quarter turns: snapped, and the range (3 turns) is enforced.
    const hsc = await sessionRepository.addAdjustment(s.id, { path: 'shock.adj.hsc', after: 1.8, reason: '' });
    expect(hsc.after).toBe(1.75);
    await expect(
      sessionRepository.addAdjustment(s.id, { path: 'shock.m.raceSag', after: 999, reason: '' }),
    ).rejects.toThrow(/Expected/);
    await expect(sessionRepository.addAdjustment(s.id, { path: 'fork.adj.nope', after: 1, reason: '' })).rejects.toThrow();
  });

  it('numbers test runs and keeps an append-only timeline; undo removes only the last entry', async () => {
    const s = await sessionRepository.start(activeBike().id);
    await sessionRepository.addTestRun(s.id, { outcome: null, symptoms: [], notes: '' });
    await sessionRepository.addAdjustment(s.id, { path: 'fork.adj.rebound', after: 12, reason: '' });
    const run2 = await sessionRepository.addTestRun(s.id, {
      outcome: 'better',
      symptoms: [
        { id: 'x', symptom: 'rearKicking', customLabel: '', end: 'rear', severity: 3, situations: ['brakingBumps'], confidence: 'high', notes: '' },
      ],
      notes: '',
    });
    expect(run2.runNumber).toBe(2);
    expect(getState().sessions[s.id]!.events.map((e) => e.type)).toEqual(['testRun', 'adjustment', 'testRun']);
    await sessionRepository.undoLastEvent(s.id);
    expect(getState().sessions[s.id]!.events.map((e) => e.type)).toEqual(['testRun', 'adjustment']);
  });

  it('logs condition changes in the timeline', async () => {
    const s = await sessionRepository.start(activeBike().id);
    const c = { ...getState().sessions[s.id]!.conditions, moisture: 'wet' as const };
    await sessionRepository.updateConditions(s.id, c);
    const stored = getState().sessions[s.id]!;
    expect(stored.conditions.moisture).toBe('wet');
    expect(stored.events[0]?.type).toBe('conditions');
  });

  it('ends and stamps endedAt', async () => {
    const s = await sessionRepository.start(activeBike().id);
    const ended = await sessionRepository.end(s.id);
    expect(ended.status).toBe('completed');
    expect(ended.endedAt).not.toBeNull();
  });
});

describe('saved setups', () => {
  it('restore preserves the previous configuration first', async () => {
    const bike = activeBike();
    const saved = await savedSetupRepository.save(bike.id, { name: 'Sand setup' });
    await bikeRepository.updateSuspension(bike.id, withSettingValue(bike.suspension, 'shock.adj.lsc', 4));
    const { previousSavedId } = await savedSetupRepository.restore(saved.id);

    expect(getSettingValue(activeBike().suspension, 'shock.adj.lsc')?.value).toBe(10);
    const previous = getState().savedSetups[previousSavedId]!;
    expect(previous.origin).toBe('autoBeforeRestore');
    expect(getSettingValue(previous.setup, 'shock.adj.lsc')?.value).toBe(4);
  });
});

describe('bikes & rider', () => {
  it('switching the active bike keeps every session', async () => {
    const first = activeBike();
    await sessionRepository.start(first.id);
    const second = await bikeRepository.create({ year: 2025, make: 'Honda', model: 'CRF450R' });
    await bikeRepository.setActive(second.id);
    expect(getState().activeBikeId).toBe(second.id);
    expect(Object.values(getState().sessions).filter((s) => s.bikeId === first.id)).toHaveLength(1);
  });

  it('changing display units never changes stored values', async () => {
    const bike = activeBike();
    await bikeRepository.updateUnits(bike.id, { length: 'in', springRate: 'kgf/mm', temperature: 'F' });
    expect(getSettingValue(activeBike().suspension, 'shock.m.springRate')?.value).toBe(52);
  });

  it('stores rider profile fields', async () => {
    const r = await riderRepository.update({ weightKg: 80, skill: 'intermediate' });
    expect(r).toMatchObject({ weightKg: 80, skill: 'intermediate' });
    expect(r.updatedAt).not.toBeNull();
  });
});

describe('persistence', () => {
  it('writes to AsyncStorage and rehydrates the same data (simulated restart)', async () => {
    const s = await sessionRepository.start(activeBike().id, { trackName: 'Persist MX' });
    await sessionRepository.addAdjustment(s.id, { path: 'fork.adj.rebound', after: 12, reason: '' });
    await new Promise((r) => setTimeout(r, 0));
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(raw).toContain('Persist MX');

    // Simulate a cold start: memory is fresh, storage still holds the saved blob.
    setState({ bikes: {}, sessions: {}, savedSetups: {}, activeBikeId: null }, false); // (persist echoes this to storage)
    await AsyncStorage.setItem(STORAGE_KEY, raw!); // …so restore what was on disk before the "restart"
    await useDataStore.persist.rehydrate();
    const restored = getState().sessions[s.id]!;
    expect(restored.trackName).toBe('Persist MX');
    expect(restored.events).toHaveLength(1);
  });
});
