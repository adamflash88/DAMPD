import { createBike, createSession } from '../src/domain/factories';
import { seedBikes } from '../src/domain/seed';
import { getSetting, SETTING_DEFS } from '../src/domain/settings';
import {
  applyAdjustments,
  countUnverified,
  diffHardware,
  diffSettings,
  effectiveValue,
  withHardware,
  withSetting,
} from '../src/domain/setup';

describe('seed data', () => {
  it('marks every seeded suspension spec as unverified', () => {
    const [bike] = seedBikes();
    expect(bike).toBeDefined();
    const setup = bike!.suspension;
    for (const end of ['fork', 'shock'] as const) {
      expect(setup[end].make.isVerified).toBe(false);
      expect(setup[end].model.isVerified).toBe(false);
      for (const spec of Object.values(setup[end].settings)) expect(spec.isVerified).toBe(false);
      for (const spec of Object.values(setup[end].clickerRanges)) expect(spec.isVerified).toBe(false);
    }
    expect(countUnverified(setup)).toBeGreaterThan(0);
  });

  it('seeds a 2026 Kawasaki KX250 with default units', () => {
    const [bike] = seedBikes();
    expect(bike).toMatchObject({ year: 2026, make: 'Kawasaki', model: 'KX250' });
    expect(bike!.units).toMatchObject({ sag: 'mm', springRate: 'N/mm', clickerConvention: 'clicksOutFromFullStiff' });
  });
});

describe('session snapshots', () => {
  it('is unaffected by later edits to the live profile', () => {
    const bike = seedBikes()[0]!;
    const session = createSession(bike, { trackName: 'Test track' });
    const before = JSON.stringify(session.snapshot);

    // Edit the live profile in every way the UI can.
    bike.suspension = withSetting(bike.suspension, 'fork.compression', 3);
    bike.suspension = withHardware(bike.suspension, 'shock', 'make', { value: 'Other', isVerified: true });
    bike.suspension.fork.modifications.push('mutated in place');
    bike.units.springRate = 'kg/mm';

    expect(JSON.stringify(session.snapshot)).toBe(before);
    expect(session.snapshot.units.springRate).toBe('N/mm');
  });

  it('records ids and timestamps', () => {
    const session = createSession(createBike({ year: 2026, make: 'A', model: 'B' }), { trackName: 'T' });
    expect(session.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(session.createdAt).toBe(session.updatedAt);
    expect(session.status).toBe('active');
  });
});

describe('adjustments as deltas', () => {
  const base = withSetting(withSetting(seedBikes()[0]!.suspension, 'fork.rebound', 10), 'shock.raceSag', 105);

  it('applies adjustments in order on top of the snapshot', () => {
    const adjustments = [
      { setting: 'fork.rebound' as const, after: 12 },
      { setting: 'shock.raceSag' as const, after: 102 },
      { setting: 'fork.rebound' as const, after: 11 },
    ];
    const result = applyAdjustments(base, adjustments);
    expect(getSetting(result, 'fork.rebound')).toEqual({ value: 11, isVerified: true });
    expect(getSetting(result, 'shock.raceSag').value).toBe(102);
    // Snapshot itself untouched.
    expect(getSetting(base, 'fork.rebound').value).toBe(10);
  });

  it('derives the current value from the latest adjustment for that setting', () => {
    const adjustments = [
      { setting: 'fork.rebound' as const, after: 12 },
      { setting: 'fork.rebound' as const, after: 14 },
    ];
    expect(effectiveValue(base, adjustments, 'fork.rebound')).toBe(14);
    expect(effectiveValue(base, adjustments, 'shock.raceSag')).toBe(105);
  });
});

describe('diffing', () => {
  it('flags only changed settings', () => {
    const a = seedBikes()[0]!.suspension;
    const b = withSetting(a, 'shock.lowSpeedCompression', 6);
    const diffs = diffSettings(a, b);
    expect(diffs).toHaveLength(SETTING_DEFS.length);
    expect(diffs.filter((d) => d.changed).map((d) => d.key)).toEqual(['shock.lowSpeedCompression']);
  });

  it('flags hardware and modification changes', () => {
    const a = seedBikes()[0]!.suspension;
    const b = { ...a, fork: { ...a.fork, modifications: ['Revalved'] } };
    const changed = diffHardware(a, b).filter((d) => d.changed);
    expect(changed).toEqual([expect.objectContaining({ end: 'fork', label: 'Modifications', b: 'Revalved' })]);
  });
});
