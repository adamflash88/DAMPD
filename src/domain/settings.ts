import type {
  BikeUnits,
  ForkSettingKey,
  SettingKey,
  ShockSettingKey,
  Spec,
  SuspensionEndId,
  SuspensionSetup,
} from './types';

export type SettingKind = 'springRate' | 'clicker' | 'sag' | 'length' | 'oilLevel';

export interface SettingDef {
  key: SettingKey;
  end: SuspensionEndId;
  id: ForkSettingKey | ShockSettingKey;
  label: string;
  shortLabel: string;
  kind: SettingKind;
  /** Increment used by steppers / suggested precision for inputs. */
  step: number;
  decimals: number;
}

/** Registry of every numeric setting, in display order. */
export const SETTING_DEFS: readonly SettingDef[] = [
  { key: 'fork.springRate', end: 'fork', id: 'springRate', label: 'Spring rate', shortLabel: 'Spring', kind: 'springRate', step: 0.01, decimals: 2 },
  { key: 'fork.compression', end: 'fork', id: 'compression', label: 'Compression', shortLabel: 'Comp', kind: 'clicker', step: 1, decimals: 0 },
  { key: 'fork.rebound', end: 'fork', id: 'rebound', label: 'Rebound', shortLabel: 'Reb', kind: 'clicker', step: 1, decimals: 0 },
  { key: 'fork.forkHeight', end: 'fork', id: 'forkHeight', label: 'Fork height (tube above clamp)', shortLabel: 'Height', kind: 'length', step: 1, decimals: 1 },
  { key: 'fork.oilLevel', end: 'fork', id: 'oilLevel', label: 'Oil level', shortLabel: 'Oil', kind: 'oilLevel', step: 5, decimals: 0 },
  { key: 'fork.raceSag', end: 'fork', id: 'raceSag', label: 'Race sag', shortLabel: 'Sag', kind: 'sag', step: 1, decimals: 0 },
  { key: 'shock.springRate', end: 'shock', id: 'springRate', label: 'Spring rate', shortLabel: 'Spring', kind: 'springRate', step: 0.1, decimals: 1 },
  { key: 'shock.highSpeedCompression', end: 'shock', id: 'highSpeedCompression', label: 'High-speed compression', shortLabel: 'HSC', kind: 'clicker', step: 1, decimals: 0 },
  { key: 'shock.lowSpeedCompression', end: 'shock', id: 'lowSpeedCompression', label: 'Low-speed compression', shortLabel: 'LSC', kind: 'clicker', step: 1, decimals: 0 },
  { key: 'shock.rebound', end: 'shock', id: 'rebound', label: 'Rebound', shortLabel: 'Reb', kind: 'clicker', step: 1, decimals: 0 },
  { key: 'shock.raceSag', end: 'shock', id: 'raceSag', label: 'Race sag', shortLabel: 'Race sag', kind: 'sag', step: 1, decimals: 0 },
  { key: 'shock.staticSag', end: 'shock', id: 'staticSag', label: 'Static sag', shortLabel: 'Static', kind: 'sag', step: 1, decimals: 0 },
];

const DEFS_BY_KEY = new Map(SETTING_DEFS.map((d) => [d.key, d]));

export function getSettingDef(key: SettingKey): SettingDef {
  const def = DEFS_BY_KEY.get(key);
  if (!def) throw new Error(`Unknown setting: ${key}`);
  return def;
}

export function settingDefsFor(end: SuspensionEndId): SettingDef[] {
  return SETTING_DEFS.filter((d) => d.end === end);
}

export function isSettingKey(value: string): value is SettingKey {
  return DEFS_BY_KEY.has(value as SettingKey);
}

export function unitLabel(kind: SettingKind, units: BikeUnits): string {
  switch (kind) {
    case 'springRate':
      return units.springRate;
    case 'sag':
      return units.sag;
    case 'length':
      return units.length;
    case 'oilLevel':
      return units.oilLevel;
    case 'clicker':
      return units.clickerConvention === 'clicksOutFromFullStiff' ? 'out' : 'in';
  }
}

export function clickerConventionLabel(units: BikeUnits): string {
  return units.clickerConvention === 'clicksOutFromFullStiff'
    ? 'Clicks out from full stiff'
    : 'Clicks in from full soft';
}

export function formatValue(value: number | null, def: SettingDef): string {
  if (value === null || Number.isNaN(value)) return '—';
  // Round to the setting's precision, then drop trailing zeros (4.90 → "4.9").
  return def.kind === 'clicker' ? String(Math.round(value)) : String(Number(value.toFixed(def.decimals)));
}

// ---------------------------------------------------------------------------
// Typed accessors (keep the indexing in one place)
// ---------------------------------------------------------------------------

export function getSetting(setup: SuspensionSetup, key: SettingKey): Spec<number> {
  const def = getSettingDef(key);
  const settings = setup[def.end].settings as Record<string, Spec<number>>;
  return settings[def.id] ?? { value: null, isVerified: false };
}

/** Clicker range (max clicks) for a clicker setting; undefined for non-clickers. */
export function getClickerRange(setup: SuspensionSetup, key: SettingKey): Spec<number> | undefined {
  const def = getSettingDef(key);
  if (def.kind !== 'clicker') return undefined;
  const ranges = setup[def.end].clickerRanges as Record<string, Spec<number>>;
  return ranges[def.id];
}
