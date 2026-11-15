/**
 * Pure functions over suspension setups: immutable edits, snapshots,
 * deriving the effective setup from a session timeline, diffing, and
 * setup-completeness / provenance summaries.
 */
import { newId, nowISO } from './ids';
import {
  adjusterPath,
  applicableMeasurements,
  applicablePaths,
  describeSetting,
  findAdjuster,
  getSettingValue,
  normalizeAdjusterValue,
  parsePath,
  type SettingDescriptor,
} from './settings';
import type {
  Adjuster,
  AdjustmentEvent,
  Bike,
  ForkMeasurementKey,
  ISODateTime,
  SessionEvent,
  SettingPath,
  SetupSnapshot,
  ShockMeasurementKey,
  SpringType,
  SuspensionEnd,
  SuspensionSetup,
  Value,
  ValueSource,
} from './types';

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function bikeName(bike: Pick<Bike, 'year' | 'make' | 'model'>): string {
  return `${bike.year} ${bike.make} ${bike.model}`.trim();
}

export function bikeLabel(bike: Pick<Bike, 'year' | 'make' | 'model' | 'nickname'>): string {
  return bike.nickname ? `${bike.nickname} · ${bikeName(bike)}` : bikeName(bike);
}

/** A rider-entered value. Clearing a value makes it unknown. */
export function userValue<T>(value: T | null): Value<T> {
  return value === null ? { value: null, source: 'unknown' } : { value, source: 'user' };
}

// ---------------------------------------------------------------------------
// Immutable edits (every rider edit produces source 'user')
// ---------------------------------------------------------------------------

function mapAdjusters(
  setup: SuspensionSetup,
  end: SuspensionEnd,
  fn: (adjusters: Adjuster[]) => Adjuster[],
): SuspensionSetup {
  return { ...setup, [end]: { ...setup[end], adjusters: fn(setup[end].adjusters) } };
}

export function withSettingValue(setup: SuspensionSetup, path: SettingPath, value: number | null): SuspensionSetup {
  const p = parsePath(path);
  if (!p) return setup;
  if (p.kind === 'adj') {
    return mapAdjusters(setup, p.end, (list) =>
      list.map((a) =>
        a.id === p.key ? { ...a, current: userValue(value === null ? null : normalizeAdjusterValue(a, value)) } : a,
      ),
    );
  }
  const end = setup[p.end];
  return { ...setup, [p.end]: { ...end, measurements: { ...end.measurements, [p.key]: userValue(value) } } };
}

export function withAdjuster(setup: SuspensionSetup, end: SuspensionEnd, adjuster: Adjuster): SuspensionSetup {
  return mapAdjusters(setup, end, (list) =>
    list.some((a) => a.id === adjuster.id) ? list.map((a) => (a.id === adjuster.id ? adjuster : a)) : [...list, adjuster],
  );
}

export function withoutAdjuster(setup: SuspensionSetup, end: SuspensionEnd, id: string): SuspensionSetup {
  return mapAdjusters(setup, end, (list) => list.filter((a) => a.id !== id));
}

export function withHardware(setup: SuspensionSetup, end: SuspensionEnd, field: 'make' | 'model', value: string): SuspensionSetup {
  const trimmed = value.trim();
  return {
    ...setup,
    [end]: { ...setup[end], hardware: { ...setup[end].hardware, [field]: userValue(trimmed || null) } },
  };
}

export function withSpringType(setup: SuspensionSetup, springType: SpringType): SuspensionSetup {
  return { ...setup, fork: { ...setup.fork, springType } };
}

export function withModificationAdded(setup: SuspensionSetup, end: SuspensionEnd, description: string): SuspensionSetup {
  const text = description.trim();
  if (!text) return setup;
  const mod = { id: newId(), description: text, addedAt: nowISO() };
  return { ...setup, [end]: { ...setup[end], modifications: [...setup[end].modifications, mod] } };
}

export function withModificationRemoved(setup: SuspensionSetup, end: SuspensionEnd, id: string): SuspensionSetup {
  return { ...setup, [end]: { ...setup[end], modifications: setup[end].modifications.filter((m) => m.id !== id) } };
}

/** Marks a demo value as confirmed by the rider (becomes 'user', never 'manufacturer'). */
function confirm<T>(v: Value<T>): Value<T> {
  return v.source === 'demo' && v.value !== null ? { ...v, source: 'user' } : v;
}

/** Converts every demo value to a rider-confirmed value. UI must ask first. */
export function confirmDemoValues(setup: SuspensionSetup): SuspensionSetup {
  const s = deepClone(setup);
  for (const end of ['fork', 'shock'] as const) {
    const e = s[end];
    e.hardware.make = confirm(e.hardware.make);
    e.hardware.model = confirm(e.hardware.model);
    e.adjusters = e.adjusters.map((a) => ({ ...a, current: confirm(a.current), range: confirm(a.range) }));
    const m = e.measurements as unknown as Record<string, Value<number>>;
    for (const k of Object.keys(m)) m[k] = confirm(m[k]!);
  }
  return s;
}

// ---------------------------------------------------------------------------
// Provenance & completeness
// ---------------------------------------------------------------------------

/** All provenance-carrying values that apply to this setup. */
function applicableValues(setup: SuspensionSetup): Value<unknown>[] {
  const out: Value<unknown>[] = [];
  for (const end of ['fork', 'shock'] as const) {
    const e = setup[end];
    out.push(e.hardware.make, e.hardware.model);
    for (const a of e.adjusters) out.push(a.current, a.range);
    for (const d of applicableMeasurements(setup, end)) out.push(getSettingValue(setup, `${end}.m.${d.key}`)!);
  }
  return out;
}

export function countBySource(setup: SuspensionSetup): Record<ValueSource, number> {
  const counts: Record<ValueSource, number> = { manufacturer: 0, user: 0, demo: 0, unknown: 0 };
  for (const v of applicableValues(setup)) counts[v.value === null ? 'unknown' : v.source]++;
  return counts;
}

export type SetupStatus = 'complete' | 'partial' | 'notConfigured';

/** Core values a rider would normally know; drives the status pill. */
const CORE_FORK: ForkMeasurementKey[] = ['springRate'];
const CORE_SHOCK: ShockMeasurementKey[] = ['springRate', 'raceSag'];

function coreValues(setup: SuspensionSetup): Value<unknown>[] {
  const fork = setup.fork;
  const values: Value<unknown>[] = [
    fork.hardware.make,
    setup.shock.hardware.make,
    ...fork.adjusters.map((a) => a.current),
    ...setup.shock.adjusters.map((a) => a.current),
    ...setup.shock.adjusters.length === 0 && fork.adjusters.length === 0 ? [{ value: null, source: 'unknown' as const }] : [],
    ...CORE_SHOCK.map((k) => setup.shock.measurements[k]),
    ...(fork.springType === 'air' ? [fork.measurements.airPressure] : CORE_FORK.map((k) => fork.measurements[k])),
  ];
  return values;
}

/**
 * complete:      every core value known and rider/manufacturer sourced
 * notConfigured: no core value known at all
 * partial:       anything in between (including demo-only values)
 */
export function setupStatus(setup: SuspensionSetup): SetupStatus {
  const core = coreValues(setup);
  const known = core.filter((v) => v.value !== null);
  if (known.length === 0) return 'notConfigured';
  const confirmed = known.filter((v) => v.source === 'user' || v.source === 'manufacturer');
  return confirmed.length === core.length ? 'complete' : 'partial';
}

// ---------------------------------------------------------------------------
// Snapshots & timeline
// ---------------------------------------------------------------------------

/** Deep copy of setup + units. Shares no references with the bike. */
export function createSnapshot(bike: Bike, capturedAt: ISODateTime): SetupSnapshot {
  return deepClone({ capturedAt, bikeLabel: bikeLabel(bike), units: bike.units, setup: bike.suspension });
}

/** Effective setup = snapshot with every adjustment's `after` applied in order. */
export function applyAdjustments(snapshot: SuspensionSetup, events: readonly SessionEvent[]): SuspensionSetup {
  return events.reduce(
    (setup, e) => (e.type === 'adjustment' ? withSettingValue(setup, e.path, e.after) : setup),
    snapshot,
  );
}

/** Value of a setting at the end of the given events (used as an adjustment's `before`). */
export function effectiveValue(snapshot: SuspensionSetup, events: readonly SessionEvent[], path: SettingPath): number | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e && e.type === 'adjustment' && e.path === path) return e.after;
  }
  return getSettingValue(snapshot, path)?.value ?? null;
}

export function adjustmentsOf(events: readonly SessionEvent[]): AdjustmentEvent[] {
  return events.filter((e): e is AdjustmentEvent => e.type === 'adjustment');
}

// ---------------------------------------------------------------------------
// Diffing
// ---------------------------------------------------------------------------

export interface SettingDiff {
  path: SettingPath;
  descriptor: SettingDescriptor;
  a: number | null;
  b: number | null;
  /** Present on only one side (e.g. adjuster added or removed). */
  presence: 'both' | 'aOnly' | 'bOnly';
  changed: boolean;
}

const same = (a: number | null, b: number | null) =>
  a === b || (a !== null && b !== null && Math.abs(a - b) < 1e-9);

export function diffSettings(a: SuspensionSetup, b: SuspensionSetup): SettingDiff[] {
  const paths = [...new Set([...applicablePaths(a), ...applicablePaths(b)])];
  return paths.flatMap((path) => {
    const da = describeSetting(a, path);
    const db = describeSetting(b, path);
    const descriptor = db ?? da;
    if (!descriptor) return [];
    const av = da ? (getSettingValue(a, path)?.value ?? null) : null;
    const bv = db ? (getSettingValue(b, path)?.value ?? null) : null;
    const presence = da && db ? 'both' : da ? 'aOnly' : 'bOnly';
    return [{ path, descriptor, a: av, b: bv, presence, changed: presence !== 'both' || !same(av, bv) }];
  });
}

export interface TextDiff {
  end: SuspensionEnd;
  label: string;
  a: string;
  b: string;
  changed: boolean;
}

export function diffHardware(a: SuspensionSetup, b: SuspensionSetup): TextDiff[] {
  return (['fork', 'shock'] as const).flatMap((end) => {
    const rows: [string, string, string][] = [
      ['Make', a[end].hardware.make.value ?? '', b[end].hardware.make.value ?? ''],
      ['Model', a[end].hardware.model.value ?? '', b[end].hardware.model.value ?? ''],
      ['Mods', a[end].modifications.map((m) => m.description).join(', '), b[end].modifications.map((m) => m.description).join(', ')],
    ];
    if (end === 'fork') rows.push(['Spring type', a.fork.springType, b.fork.springType]);
    return rows.map(([label, av, bv]) => ({ end, label, a: av, b: bv, changed: av.trim() !== bv.trim() }));
  });
}

/** Paths whose value differs between two setups (for highlighting). */
export function changedPaths(a: SuspensionSetup, b: SuspensionSetup): Set<SettingPath> {
  return new Set(diffSettings(a, b).filter((d) => d.changed).map((d) => d.path));
}

export { adjusterPath, findAdjuster };
