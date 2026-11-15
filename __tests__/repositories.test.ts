import { bikeRepository, sessionRepository } from '../src/data';
import { migratePersistedState, SCHEMA_VERSION } from '../src/data/migrations';
import { getState, initialState, setState } from '../src/data/zustand/store';
import { getSetting } from '../src/domain/settings';
import { withSetting } from '../src/domain/setup';

beforeEach(() => {
  setState(initialState(), true);
});

const activeBike = () => {
  const { activeBikeId, bikes } = getState();
  return bikes[activeBikeId!]!;
};

describe('repositories', () => {
  it('starts with the seeded bike active', () => {
    expect(activeBike()).toMatchObject({ make: 'Kawasaki', model: 'KX250' });
  });

  it('keeps session history intact when the profile is edited', async () => {
    const bike = activeBike();
    const session = await sessionRepository.start(bike.id, { trackName: 'Track' });
    const snapCompression = getSetting(session.snapshot.setup, 'fork.compression').value;

    await bikeRepository.updateSuspension(bike.id, withSetting(bike.suspension, 'fork.compression', 1));

    const stored = getState().sessions[session.id]!;
    expect(getSetting(stored.snapshot.setup, 'fork.compression').value).toBe(snapCompression);
    expect(getSetting(activeBike().suspension, 'fork.compression').value).toBe(1);
  });

  it('records adjustments as before → after against the snapshot', async () => {
    const bike = activeBike();
    const s = await sessionRepository.start(bike.id, { trackName: 'Track' });
    const start = getSetting(s.snapshot.setup, 'shock.rebound').value;

    const a1 = await sessionRepository.addAdjustment(s.id, { setting: 'shock.rebound', after: 12, reason: 'Kicking' });
    const a2 = await sessionRepository.addAdjustment(s.id, { setting: 'shock.rebound', after: 14, reason: ' ' });
    expect(a1).toMatchObject({ before: start, after: 12, reason: 'Kicking' });
    expect(a2).toMatchObject({ before: 12, after: 14, reason: '' });

    // Removing the first re-bases the second onto the snapshot value.
    await sessionRepository.removeAdjustment(s.id, a1.id);
    const remaining = getState().sessions[s.id]!.adjustments;
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toMatchObject({ id: a2.id, before: start, after: 14 });
  });

  it('updates updatedAt on writes', async () => {
    const bike = activeBike();
    const updated = await bikeRepository.updateDetails(bike.id, { nickname: 'Race' });
    expect(updated.updatedAt >= bike.updatedAt).toBe(true);
    expect(updated.createdAt).toBe(bike.createdAt);
  });

  it('deleting a bike removes its sessions and reassigns the active bike', async () => {
    const other = await bikeRepository.create({ year: 2024, make: 'Test', model: 'X' });
    const bike = activeBike();
    await sessionRepository.start(bike.id, { trackName: 'Track' });
    await bikeRepository.remove(bike.id);
    expect(Object.values(getState().sessions)).toHaveLength(0);
    expect(getState().activeBikeId).toBe(other.id);
  });
});

describe('migrations', () => {
  it('passes through state already at the current version', () => {
    const state = initialState();
    expect(migratePersistedState(state, SCHEMA_VERSION)).toBe(state);
  });

  it('refuses to silently skip a missing migration', () => {
    expect(() => migratePersistedState({}, 0)).toThrow(/Missing migration/);
  });

  it('leaves data from a newer schema untouched', () => {
    const state = initialState();
    expect(migratePersistedState(state, SCHEMA_VERSION + 1)).toBe(state);
  });
});
