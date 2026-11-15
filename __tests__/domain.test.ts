import { catalogMakes, catalogModels, filterOptions } from '../src/domain/catalog';
import { buildTuningContext } from '../src/domain/context';
import { createAdjuster, createBike, createSession, emptyRiderProfile, emptySetup } from '../src/domain/factories';
import { seedBikes } from '../src/domain/seed';
import { toRiderView, type ServiceRecord } from '../src/domain/service';
import {
  applicablePaths,
  describeSetting,
  formatAdjusterValue,
  formatDelta,
  formatTurns,
  getSettingValue,
  normalizeAdjusterValue,
  validateSetting,
} from '../src/domain/settings';
import {
  applyAdjustments,
  confirmDemoValues,
  countBySource,
  diffSettings,
  effectiveValue,
  setupStatus,
  withAdjuster,
  withHardware,
  withModificationAdded,
  withSettingValue,
  withSpringType,
} from '../src/domain/setup';
import { summarizeSession } from '../src/domain/session';
import type { AdjustmentEvent, SessionEvent } from '../src/domain/types';
import { DEFAULT_UNITS, formatQuantity, fromDisplay, N_PER_KGF, toDisplay } from '../src/domain/units';

const adj = (path: AdjustmentEvent['path'], after: number): AdjustmentEvent => ({
  type: 'adjustment',
  id: `${path}-${after}`,
  at: '2026-01-01T00:00:00.000Z',
  path,
  before: null,
  after,
  reason: '',
});

describe('units', () => {
  it('round-trips spring rates and lengths through display units', () => {
    const imperial = { length: 'in', springRate: 'kgf/mm', temperature: 'F' } as const;
    expect(toDisplay('springRate', N_PER_KGF * 5, imperial)).toBeCloseTo(5);
    expect(fromDisplay('length', 1, imperial)).toBeCloseTo(25.4);
    expect(fromDisplay('temperature', 212, imperial)).toBeCloseTo(100);
    expect(formatQuantity('springRate', 49.03325, imperial)).toBe('5 kgf/mm');
  });

  it('never converts oil volume (cc) as if it were a length', () => {
    const imperial = { length: 'in', springRate: 'kgf/mm', temperature: 'C' } as const;
    expect(toDisplay('volume', 350, imperial)).toBe(350);
    expect(formatQuantity('volume', 350, imperial)).toBe('350 cc');
  });
});

describe('adjusters', () => {
  it('formats fractional turns and snaps to the adjuster step', () => {
    expect(formatTurns(1.5)).toBe('1½');
    expect(formatTurns(0.25)).toBe('¼');
    const hsc = { ...createAdjuster({ kind: 'hsc', mechanism: 'turns', step: 0.25 }), range: { value: 3, source: 'user' as const } };
    expect(normalizeAdjusterValue(hsc, 1.3)).toBe(1.25);
    expect(normalizeAdjusterValue(hsc, 9)).toBe(3);
    expect(formatAdjusterValue(hsc, 1.5)).toBe('1½ turns out');
  });

  it('describes deltas with an unambiguous direction', () => {
    const setup = seedBikes()[0]!.suspension;
    const d = describeSetting(setup, 'fork.adj.compression')!;
    expect(formatDelta(d, 10, 12, DEFAULT_UNITS)).toEqual({ text: '+2 clicks out', direction: 'softer' });
    expect(formatDelta(d, 12, 10, DEFAULT_UNITS)).toEqual({ text: '−2 clicks out', direction: 'stiffer' });
    const inConv = { ...d, adjuster: { ...d.adjuster!, convention: 'inFromFullSoft' as const } };
    expect(formatDelta(inConv, 10, 12, DEFAULT_UNITS).direction).toBe('stiffer');
  });

  it('validates against the adjuster range and plausibility bounds', () => {
    const setup = seedBikes()[0]!.suspension;
    expect(validateSetting(describeSetting(setup, 'fork.adj.compression')!, 25, DEFAULT_UNITS)).toMatch(/range/);
    expect(validateSetting(describeSetting(setup, 'shock.m.raceSag')!, 900, DEFAULT_UNITS)).toMatch(/Expected/);
    expect(validateSetting(describeSetting(setup, 'shock.m.raceSag')!, 105, DEFAULT_UNITS)).toBeNull();
  });
});

describe('applicability', () => {
  it('shows air pressure only on air forks and spring rate only on coil forks', () => {
    const coil = emptySetup();
    expect(applicablePaths(coil, 'fork')).toContain('fork.m.springRate');
    expect(applicablePaths(coil, 'fork')).not.toContain('fork.m.airPressure');
    const air = withSpringType(coil, 'air');
    expect(applicablePaths(air, 'fork')).toContain('fork.m.airPressure');
    expect(applicablePaths(air, 'fork')).not.toContain('fork.m.springRate');
  });

  it('supports custom adjusters and HSR/LSR', () => {
    const custom = createAdjuster({ kind: 'custom', label: 'Preload ring' });
    const s = withAdjuster(withAdjuster(emptySetup(), 'shock', createAdjuster({ kind: 'hsr' })), 'shock', custom);
    expect(applicablePaths(s, 'shock')).toEqual(expect.arrayContaining(['shock.adj.hsr', `shock.adj.${custom.id}`]));
  });
});

describe('provenance', () => {
  it('seed values are demo, never user or manufacturer', () => {
    const counts = countBySource(seedBikes()[0]!.suspension);
    expect(counts.demo).toBeGreaterThan(0);
    expect(counts.user).toBe(0);
    expect(counts.manufacturer).toBe(0);
  });

  it('editing makes a value user-sourced; clearing makes it unknown', () => {
    let s = seedBikes()[0]!.suspension;
    s = withSettingValue(s, 'fork.adj.rebound', 12);
    expect(getSettingValue(s, 'fork.adj.rebound')).toEqual({ value: 12, source: 'user' });
    s = withSettingValue(s, 'fork.adj.rebound', null);
    expect(getSettingValue(s, 'fork.adj.rebound')).toEqual({ value: null, source: 'unknown' });
  });

  it('confirming demo values yields user (not manufacturer) and keeps unknowns unknown', () => {
    const confirmed = confirmDemoValues(seedBikes()[0]!.suspension);
    const counts = countBySource(confirmed);
    expect(counts.demo).toBe(0);
    expect(counts.manufacturer).toBe(0);
    expect(getSettingValue(confirmed, 'fork.m.raceSag')).toEqual({ value: null, source: 'unknown' });
  });
});

describe('setup status', () => {
  it('is notConfigured when empty, partial with demo values, complete when confirmed', () => {
    expect(setupStatus(emptySetup())).toBe('notConfigured');
    const seed = seedBikes()[0]!.suspension;
    expect(setupStatus(seed)).toBe('partial');
    expect(setupStatus(confirmDemoValues(seed))).toBe('complete');
  });
});

describe('session timeline', () => {
  it('applies adjustments in order without touching the snapshot', () => {
    const base = seedBikes()[0]!.suspension;
    const events: SessionEvent[] = [adj('fork.adj.rebound', 12), adj('shock.m.raceSag', 102), adj('fork.adj.rebound', 11)];
    const result = applyAdjustments(base, events);
    expect(getSettingValue(result, 'fork.adj.rebound')?.value).toBe(11);
    expect(getSettingValue(result, 'shock.m.raceSag')?.value).toBe(102);
    expect(getSettingValue(base, 'fork.adj.rebound')?.value).toBe(10);
    expect(effectiveValue(base, events, 'fork.adj.rebound')).toBe(11);
  });

  it('snapshots are immune to later garage edits', () => {
    const bike = seedBikes()[0]!;
    const session = createSession(bike, { trackName: 'Test' });
    const frozen = JSON.stringify(session.snapshot);
    bike.suspension = withHardware(withSettingValue(bike.suspension, 'fork.adj.compression', 3), 'shock', 'make', 'Other');
    bike.suspension = withModificationAdded(bike.suspension, 'fork', 'Revalve');
    bike.suspension.fork.adjusters.push(createAdjuster({ kind: 'custom', label: 'mutated in place' }));
    expect(JSON.stringify(session.snapshot)).toBe(frozen);
  });

  it('summarizes runs, outcomes and untested adjustments', () => {
    const s = createSession(seedBikes()[0]!);
    s.events = [
      { type: 'testRun', id: 'r1', at: 'a', runNumber: 1, outcome: null, symptoms: [], notes: '' },
      adj('fork.adj.rebound', 12),
      { type: 'testRun', id: 'r2', at: 'b', runNumber: 2, outcome: 'better', symptoms: [], notes: '' },
      adj('shock.adj.lsc', 8),
    ];
    const sum = summarizeSession(s);
    expect(sum).toMatchObject({ testRuns: 2, adjustments: 2, untestedAdjustments: 1 });
    expect(sum.outcomes.better).toBe(1);
  });
});

describe('diffing', () => {
  it('flags changed values and adjusters present on only one side', () => {
    const a = seedBikes()[0]!.suspension;
    let b = withSettingValue(a, 'shock.adj.lsc', 6);
    b = withAdjuster(b, 'fork', createAdjuster({ kind: 'lsr' }));
    const changed = diffSettings(a, b).filter((d) => d.changed);
    expect(changed.map((d) => d.path)).toEqual(expect.arrayContaining(['shock.adj.lsc', 'fork.adj.lsr']));
    expect(changed.find((d) => d.path === 'fork.adj.lsr')?.presence).toBe('bOnly');
  });
});

describe('catalog', () => {
  it('offers makes and models for a year and filters case-insensitively', () => {
    expect(catalogMakes(2026)).toContain('Kawasaki');
    expect(catalogModels(2026, 'Kawasaki').map((m) => m.model)).toContain('KX250');
    expect(filterOptions(['Honda', 'KTM'], 'kt', (x) => x)).toEqual(['KTM']);
  });

  it('creates catalog bikes with an empty, unconfigured setup (no invented specs)', () => {
    const bike = createBike({ year: 2026, make: 'Honda', model: 'CRF250R', catalogId: 'honda-crf250r' });
    expect(setupStatus(bike.suspension)).toBe('notConfigured');
    expect(countBySource(bike.suspension).demo).toBe(0);
  });
});

describe('future-facing contracts', () => {
  it('service records never expose technician-private fields to riders', () => {
    const record: ServiceRecord = {
      id: 'x',
      bikeId: 'b',
      technician: { id: 't', name: 'Tech', business: 'Shop' },
      createdAt: '',
      updatedAt: '',
      public: { serviceType: 'revalve', ends: ['fork'], serviceDate: '2026-01-01', summary: 'Revalve', springChanges: [], customerNotes: '', recommendedNextServiceHours: 20 },
      private: { valvingNotes: 'secret stack', internalSpecs: { midValve: 'x' }, technicianNotes: 'private' },
    };
    const view = toRiderView(record);
    expect(view).not.toHaveProperty('private');
    expect(JSON.stringify(view)).not.toContain('secret stack');
  });

  it('builds a serializable tuning context from structured data', () => {
    const bike = seedBikes()[0]!;
    const s = createSession(bike, { trackName: 'Glen Helen' });
    s.events = [adj('fork.adj.rebound', 12)];
    const ctx = buildTuningContext(bike, [s], emptyRiderProfile(), 'now');
    expect(ctx.schema).toBe('dampd.tuning-context/1');
    expect(getSettingValue(ctx.sessions[0]!.endingSetup, 'fork.adj.rebound')?.value).toBe(12);
    expect(getSettingValue(ctx.sessions[0]!.startingSetup, 'fork.adj.rebound')?.value).toBe(10);
  });
});
