/**
 * Pure functions over suspension setups: immutable updates, snapshots,
 * applying adjustment deltas and diffing two setups.
 */
import { getClickerRange, getSetting, getSettingDef, SETTING_DEFS } from './settings';
import type {
  Adjustment,
  Bike,
  ISODateTime,
  SettingKey,
  SetupSnapshot,
  Spec,
  SuspensionEndId,
  SuspensionSetup,
} from './types';

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function bikeLabel(bike: Pick<Bike, 'year' | 'make' | 'model' | 'nickname'>): string {
  const base = `${bike.year} ${bike.make} ${bike.model}`.trim();
  return bike.nickname ? `${bike.nickname} · ${base}` : base;
}

/** Returns a new setup with one numeric setting replaced. User edits are verified. */
export function withSetting(
  setup: SuspensionSetup,
  key: SettingKey,
  value: number | null,
  isVerified = true,
): SuspensionSetup {
  const def = getSettingDef(key);
  const end = setup[def.end];
  return {
    ...setup,
    [def.end]: { ...end, settings: { ...end.settings, [def.id]: { value, isVerified } } },
  };
}

export function withClickerRange(
  setup: SuspensionSetup,
  key: SettingKey,
  max: number | null,
  isVerified = true,
): SuspensionSetup {
  const def = getSettingDef(key);
  if (def.kind !== 'clicker') return setup;
  const end = setup[def.end];
  return {
    ...setup,
    [def.end]: { ...end, clickerRanges: { ...end.clickerRanges, [def.id]: { value: max, isVerified } } },
  };
}

export function withHardware(
  setup: SuspensionSetup,
  endId: SuspensionEndId,
  field: 'make' | 'model',
  value: Spec<string>,
): SuspensionSetup {
  return { ...setup, [endId]: { ...setup[endId], [field]: value } };
}

export function withModifications(
  setup: SuspensionSetup,
  endId: SuspensionEndId,
  modifications: string[],
): SuspensionSetup {
  return { ...setup, [endId]: { ...setup[endId], modifications } };
}

/** Marks every value in one end of the setup as verified by the rider. */
export function confirmAll(setup: SuspensionSetup, endId: SuspensionEndId): SuspensionSetup {
  const end = setup[endId];
  const verify = <T,>(r: Record<string, Spec<T>>) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, { ...v, isVerified: true }]));
  return {
    ...setup,
    [endId]: {
      ...end,
      make: { ...end.make, isVerified: true },
      model: { ...end.model, isVerified: true },
      settings: verify(end.settings),
      clickerRanges: verify(end.clickerRanges),
    },
  };
}

/** Counts unverified (illustrative) values in one end of a setup. */
export function countUnverifiedInEnd(setup: SuspensionSetup, endId: SuspensionEndId): number {
  const end = setup[endId];
  const specs: Spec<unknown>[] = [
    end.make,
    end.model,
    ...Object.values<Spec<number>>(end.settings),
    ...Object.values<Spec<number>>(end.clickerRanges),
  ];
  return specs.filter((s) => !s.isVerified).length;
}

/** Counts unverified (illustrative) values across the whole setup. */
export function countUnverified(setup: SuspensionSetup): number {
  return countUnverifiedInEnd(setup, 'fork') + countUnverifiedInEnd(setup, 'shock');
}

/** Deep-copies the bike's current setup + units. Shares no references with the bike. */
export function createSnapshot(bike: Bike, capturedAt: ISODateTime): SetupSnapshot {
  return deepClone({
    capturedAt,
    bikeLabel: bikeLabel(bike),
    units: bike.units,
    setup: bike.suspension,
  });
}

/** Effective setup = snapshot with every adjustment's `after` applied in order. */
export function applyAdjustments(
  snapshot: SuspensionSetup,
  adjustments: readonly Pick<Adjustment, 'setting' | 'after'>[],
): SuspensionSetup {
  return adjustments.reduce((setup, adj) => withSetting(setup, adj.setting, adj.after, true), snapshot);
}

/** Current value of a setting partway through a session (used as an adjustment's `before`). */
export function effectiveValue(
  snapshot: SuspensionSetup,
  adjustments: readonly Pick<Adjustment, 'setting' | 'after'>[],
  key: SettingKey,
): number | null {
  for (let i = adjustments.length - 1; i >= 0; i--) {
    const adj = adjustments[i];
    if (adj && adj.setting === key) return adj.after;
  }
  return getSetting(snapshot, key).value;
}

export function adjustmentDelta(adj: Pick<Adjustment, 'before' | 'after'>): number | null {
  return adj.before === null ? null : adj.after - adj.before;
}

/** Clamp a clicker value into 0…max (when a max is known). */
export function clampClicker(setup: SuspensionSetup, key: SettingKey, value: number): number {
  const max = getClickerRange(setup, key)?.value;
  const lower = Math.max(0, Math.round(value));
  return max === null || max === undefined ? lower : Math.min(lower, max);
}

// ---------------------------------------------------------------------------
// Diffing
// ---------------------------------------------------------------------------

export interface SettingDiff {
  key: SettingKey;
  a: number | null;
  b: number | null;
  changed: boolean;
}

export interface TextDiff {
  label: string;
  end: SuspensionEndId;
  a: string;
  b: string;
  changed: boolean;
}

const sameNumber = (a: number | null, b: number | null) =>
  a === b || (a !== null && b !== null && Math.abs(a - b) < 1e-9);

export function diffSettings(a: SuspensionSetup, b: SuspensionSetup): SettingDiff[] {
  return SETTING_DEFS.map(({ key }) => {
    const av = getSetting(a, key).value;
    const bv = getSetting(b, key).value;
    return { key, a: av, b: bv, changed: !sameNumber(av, bv) };
  });
}

export function diffHardware(a: SuspensionSetup, b: SuspensionSetup): TextDiff[] {
  const rows: TextDiff[] = [];
  for (const end of ['fork', 'shock'] as const) {
    const pairs: [string, string, string][] = [
      ['Make', a[end].make.value ?? '', b[end].make.value ?? ''],
      ['Model', a[end].model.value ?? '', b[end].model.value ?? ''],
      ['Modifications', a[end].modifications.join(', '), b[end].modifications.join(', ')],
    ];
    for (const [label, av, bv] of pairs) {
      rows.push({ label, end, a: av, b: bv, changed: av.trim() !== bv.trim() });
    }
  }
  return rows;
}
