/**
 * Registry of suspension settings: labels, quantities, applicability,
 * validation ranges, and formatting. Paths address settings generically so
 * adjustments, diffs and the timeline don't need per-field code.
 */
import { displayDecimals, formatNumber, formatQuantity, toDisplay, unitSymbol, type Quantity } from './units';
import type {
  Adjuster,
  AdjusterConvention,
  AdjusterKind,
  AdjusterMechanism,
  DisplayUnits,
  ForkMeasurementKey,
  ForkSetup,
  SettingPath,
  ShockMeasurementKey,
  SuspensionEnd,
  SuspensionSetup,
  Value,
} from './types';

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------

export type MeasurementGroup = 'spring' | 'geometry' | 'oil' | 'sag';

export interface MeasurementDef {
  end: SuspensionEnd;
  key: ForkMeasurementKey | ShockMeasurementKey;
  label: string;
  shortLabel: string;
  hint: string;
  quantity: Quantity;
  group: MeasurementGroup;
  /** Plausibility bounds in canonical units (for input validation, not specs). */
  min: number;
  max: number;
}

export const FORK_MEASUREMENTS: readonly MeasurementDef[] = [
  { end: 'fork', key: 'springRate', label: 'Spring rate', shortLabel: 'Spring', hint: 'Per fork leg', quantity: 'springRate', group: 'spring', min: 1, max: 30 },
  { end: 'fork', key: 'airPressure', label: 'Air pressure', shortLabel: 'Air', hint: 'Air-spring forks only', quantity: 'pressure', group: 'spring', min: 0, max: 400 },
  { end: 'fork', key: 'forkHeight', label: 'Fork height', shortLabel: 'Height', hint: 'Tube above top clamp', quantity: 'length', group: 'geometry', min: 0, max: 30 },
  { end: 'fork', key: 'oilHeight', label: 'Oil height', shortLabel: 'Oil ht', hint: 'Air gap from top of tube, spring out', quantity: 'length', group: 'oil', min: 0, max: 400 },
  { end: 'fork', key: 'oilVolume', label: 'Oil volume', shortLabel: 'Oil vol', hint: 'Per leg. Not interchangeable with oil height', quantity: 'volume', group: 'oil', min: 0, max: 2000 },
  { end: 'fork', key: 'raceSag', label: 'Race sag', shortLabel: 'Sag', hint: 'Rider on board', quantity: 'length', group: 'sag', min: 0, max: 200 },
];

export const SHOCK_MEASUREMENTS: readonly MeasurementDef[] = [
  { end: 'shock', key: 'springRate', label: 'Spring rate', shortLabel: 'Spring', hint: 'Shock spring', quantity: 'springRate', group: 'spring', min: 10, max: 200 },
  { end: 'shock', key: 'raceSag', label: 'Race sag', shortLabel: 'Race sag', hint: 'Rider on board', quantity: 'length', group: 'sag', min: 0, max: 200 },
  { end: 'shock', key: 'staticSag', label: 'Static sag', shortLabel: 'Static', hint: 'Bike on its own weight', quantity: 'length', group: 'sag', min: 0, max: 100 },
];

export function measurementDefs(end: SuspensionEnd): readonly MeasurementDef[] {
  return end === 'fork' ? FORK_MEASUREMENTS : SHOCK_MEASUREMENTS;
}

/** Only show measurements that apply to this hardware (coil vs air fork). */
export function applicableMeasurements(setup: SuspensionSetup, end: SuspensionEnd): MeasurementDef[] {
  const defs = measurementDefs(end);
  if (end !== 'fork') return [...defs];
  const fork: ForkSetup = setup.fork;
  return defs.filter((d) => (fork.springType === 'air' ? d.key !== 'springRate' : d.key !== 'airPressure'));
}

// ---------------------------------------------------------------------------
// Adjusters
// ---------------------------------------------------------------------------

export const ADJUSTER_META: Record<Exclude<AdjusterKind, 'custom'>, { label: string; shortLabel: string }> = {
  compression: { label: 'Compression', shortLabel: 'Comp' },
  rebound: { label: 'Rebound', shortLabel: 'Reb' },
  hsc: { label: 'High-speed compression', shortLabel: 'HSC' },
  lsc: { label: 'Low-speed compression', shortLabel: 'LSC' },
  hsr: { label: 'High-speed rebound', shortLabel: 'HSR' },
  lsr: { label: 'Low-speed rebound', shortLabel: 'LSR' },
};

export const STANDARD_ADJUSTER_KINDS = Object.keys(ADJUSTER_META) as Exclude<AdjusterKind, 'custom'>[];

export function adjusterShortLabel(a: Adjuster): string {
  return a.kind === 'custom' ? a.label : ADJUSTER_META[a.kind].shortLabel;
}

export function conventionWord(c: AdjusterConvention): 'out' | 'in' {
  return c === 'outFromFullStiff' ? 'out' : 'in';
}

export function conventionDescription(c: AdjusterConvention): string {
  return c === 'outFromFullStiff' ? 'out from full stiff' : 'in from full soft';
}

export function mechanismUnit(m: AdjusterMechanism, n: number | null = 2): string {
  if (m === 'clicks') return n === 1 ? 'click' : 'clicks';
  return n === 1 ? 'turn' : 'turns';
}

const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' };

/** 1.5 → "1½", 0.25 → "¼", 2 → "2"; other fractions as decimals. */
export function formatTurns(n: number): string {
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(n);
  const whole = Math.floor(abs + 1e-9);
  const frac = Number((abs - whole).toFixed(2));
  if (frac === 0) return `${sign}${whole}`;
  const glyph = FRACTIONS[String(frac)];
  if (glyph) return `${sign}${whole === 0 ? '' : whole}${glyph}`;
  return `${sign}${formatNumber(abs, 2)}`;
}

export function formatAdjusterNumber(a: Pick<Adjuster, 'mechanism'>, n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—';
  return a.mechanism === 'turns' ? formatTurns(n) : String(Math.round(n));
}

/** "10 clicks out", "1½ turns out". */
export function formatAdjusterValue(a: Pick<Adjuster, 'mechanism' | 'convention'>, n: number | null): string {
  if (n === null) return '—';
  return `${formatAdjusterNumber(a, n)} ${mechanismUnit(a.mechanism, n)} ${conventionWord(a.convention)}`;
}

/** Snap to the adjuster's step and clamp into 0…range (when known). */
export function normalizeAdjusterValue(a: Pick<Adjuster, 'step' | 'range'>, n: number): number {
  const step = a.step > 0 ? a.step : 1;
  let v = Math.round(n / step) * step;
  v = Math.max(0, v);
  const max = a.range.value;
  if (max !== null && max >= 0) v = Math.min(v, max);
  return Number(v.toFixed(4));
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

export type ParsedPath =
  | { end: SuspensionEnd; kind: 'adj'; key: string }
  | { end: SuspensionEnd; kind: 'm'; key: string };

export function adjusterPath(end: SuspensionEnd, id: string): SettingPath {
  return `${end}.adj.${id}`;
}

export function measurementPath(end: SuspensionEnd, key: string): SettingPath {
  return `${end}.m.${key}`;
}

export function parsePath(path: string): ParsedPath | null {
  const [end, kind, ...rest] = path.split('.');
  const key = rest.join('.');
  if ((end !== 'fork' && end !== 'shock') || (kind !== 'adj' && kind !== 'm') || !key) return null;
  return { end, kind, key };
}

export function findAdjuster(setup: SuspensionSetup, end: SuspensionEnd, id: string): Adjuster | undefined {
  return setup[end].adjusters.find((a) => a.id === id);
}

export function findMeasurementDef(end: SuspensionEnd, key: string): MeasurementDef | undefined {
  return measurementDefs(end).find((d) => d.key === key);
}

/** Current value at a path, or undefined if the path doesn't exist on this setup. */
export function getSettingValue(setup: SuspensionSetup, path: string): Value<number> | undefined {
  const p = parsePath(path);
  if (!p) return undefined;
  if (p.kind === 'adj') return findAdjuster(setup, p.end, p.key)?.current;
  const m = setup[p.end].measurements as unknown as Record<string, Value<number> | undefined>;
  return m[p.key];
}

export interface SettingDescriptor {
  path: SettingPath;
  end: SuspensionEnd;
  label: string;
  shortLabel: string;
  /** Present for adjuster paths. */
  adjuster?: Adjuster;
  /** Present for measurement paths. */
  measurement?: MeasurementDef;
}

export function describeSetting(setup: SuspensionSetup, path: SettingPath): SettingDescriptor | undefined {
  const p = parsePath(path);
  if (!p) return undefined;
  if (p.kind === 'adj') {
    const a = findAdjuster(setup, p.end, p.key);
    if (!a) return undefined;
    const label = a.kind === 'custom' ? a.label : ADJUSTER_META[a.kind].label;
    return { path, end: p.end, label, shortLabel: adjusterShortLabel(a), adjuster: a };
  }
  const def = findMeasurementDef(p.end, p.key);
  if (!def) return undefined;
  return { path, end: p.end, label: def.label, shortLabel: def.shortLabel, measurement: def };
}

/** Every numeric setting path that currently applies to a setup, in display order. */
export function applicablePaths(setup: SuspensionSetup, end?: SuspensionEnd): SettingPath[] {
  const ends: SuspensionEnd[] = end ? [end] : ['fork', 'shock'];
  return ends.flatMap((e) => [
    ...setup[e].adjusters.map((a) => adjusterPath(e, a.id)),
    ...applicableMeasurements(setup, e).map((d) => measurementPath(e, d.key)),
  ]);
}

export function formatSetting(d: SettingDescriptor, canonical: number | null, units: DisplayUnits, withUnit = true): string {
  if (d.adjuster) return withUnit ? formatAdjusterValue(d.adjuster, canonical) : formatAdjusterNumber(d.adjuster, canonical);
  if (d.measurement) return formatQuantity(d.measurement.quantity, canonical, units, withUnit);
  return '—';
}

/** Signed change with unit and a plain-language direction for damping. */
export function formatDelta(
  d: SettingDescriptor,
  before: number | null,
  after: number,
  units: DisplayUnits,
): { text: string; direction: string | null } {
  if (before === null) return { text: 'first recorded', direction: null };
  const diff = after - before;
  if (Math.abs(diff) < 1e-9) return { text: 'no change', direction: null };
  const sign = diff > 0 ? '+' : '−';
  if (d.adjuster) {
    const a = d.adjuster;
    const abs = Math.abs(diff);
    const num = a.mechanism === 'turns' ? formatTurns(abs) : String(Math.round(abs));
    const text = `${sign}${num} ${mechanismUnit(a.mechanism, abs)} ${conventionWord(a.convention)}`;
    // Out from full stiff: more out = softer. In from full soft: more in = stiffer.
    const softer = a.convention === 'outFromFullStiff' ? diff > 0 : diff < 0;
    return { text, direction: softer ? 'softer' : 'stiffer' };
  }
  if (d.measurement) {
    const q = d.measurement.quantity;
    const shown = Math.abs(toDisplay(q, after, units) - toDisplay(q, before, units));
    return { text: `${sign}${formatNumber(shown, displayDecimals(q, units))} ${unitSymbol(q, units)}`, direction: null };
  }
  return { text: `${sign}${formatNumber(Math.abs(diff), 2)}`, direction: null };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateSetting(d: SettingDescriptor, canonical: number, units: DisplayUnits): string | null {
  if (!Number.isFinite(canonical)) return 'Enter a number';
  if (d.adjuster) {
    if (canonical < 0) return 'Cannot be negative';
    const max = d.adjuster.range.value;
    if (max !== null && canonical > max) return `Adjuster range is 0–${formatAdjusterNumber(d.adjuster, max)}`;
    return null;
  }
  if (d.measurement) {
    const { min, max, quantity } = d.measurement;
    if (canonical < min || canonical > max) {
      return `Expected ${formatQuantity(quantity, min, units, false)}–${formatQuantity(quantity, max, units)}`;
    }
  }
  return null;
}
