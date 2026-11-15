/**
 * Unit conversion between canonical storage units and display units.
 * Canonical: mm, N/mm, cc, psi, °C, kg.
 */
import type { DisplayUnits, LengthUnit, SpringRateUnit, TemperatureUnit } from './types';

export const MM_PER_INCH = 25.4;
/** Standard gravity: 1 kgf = 9.80665 N. */
export const N_PER_KGF = 9.80665;

export const DEFAULT_UNITS: DisplayUnits = { length: 'mm', springRate: 'N/mm', temperature: 'C' };

export type Quantity = 'length' | 'springRate' | 'volume' | 'pressure' | 'temperature';

export function toDisplay(q: Quantity, canonical: number, units: DisplayUnits): number {
  switch (q) {
    case 'length':
      return units.length === 'in' ? canonical / MM_PER_INCH : canonical;
    case 'springRate':
      return units.springRate === 'kgf/mm' ? canonical / N_PER_KGF : canonical;
    case 'temperature':
      return units.temperature === 'F' ? (canonical * 9) / 5 + 32 : canonical;
    case 'volume':
    case 'pressure':
      return canonical;
  }
}

export function fromDisplay(q: Quantity, display: number, units: DisplayUnits): number {
  switch (q) {
    case 'length':
      return units.length === 'in' ? display * MM_PER_INCH : display;
    case 'springRate':
      return units.springRate === 'kgf/mm' ? display * N_PER_KGF : display;
    case 'temperature':
      return units.temperature === 'F' ? ((display - 32) * 5) / 9 : display;
    case 'volume':
    case 'pressure':
      return display;
  }
}

export function unitSymbol(q: Quantity, units: DisplayUnits): string {
  switch (q) {
    case 'length':
      return units.length;
    case 'springRate':
      return units.springRate;
    case 'volume':
      return 'cc';
    case 'pressure':
      return 'psi';
    case 'temperature':
      return units.temperature === 'F' ? '°F' : '°C';
  }
}

/** Display precision per quantity/unit. */
export function displayDecimals(q: Quantity, units: DisplayUnits): number {
  switch (q) {
    case 'length':
      return units.length === 'in' ? 2 : 1;
    case 'springRate':
      return units.springRate === 'kgf/mm' ? 2 : 1;
    case 'pressure':
      return 1;
    case 'volume':
    case 'temperature':
      return 0;
  }
}

/** Rounds to display precision and drops trailing zeros (4.90 → "4.9"). */
export function formatNumber(n: number, decimals: number): string {
  return String(Number(n.toFixed(decimals)));
}

export function formatQuantity(q: Quantity, canonical: number | null, units: DisplayUnits, withUnit = true): string {
  if (canonical === null || !Number.isFinite(canonical)) return '—';
  const text = formatNumber(toDisplay(q, canonical, units), displayDecimals(q, units));
  return withUnit ? `${text} ${unitSymbol(q, units)}` : text;
}

export const LENGTH_UNITS: readonly LengthUnit[] = ['mm', 'in'];
export const SPRING_RATE_UNITS: readonly SpringRateUnit[] = ['N/mm', 'kgf/mm'];
export const TEMPERATURE_UNITS: readonly TemperatureUnit[] = ['C', 'F'];

/** Convert a v1 stored value (in the bike's then-selected unit) to canonical. */
export function legacyToCanonical(q: 'length' | 'springRate', value: number, unit: string): number {
  if (q === 'length') return unit === 'in' ? value * MM_PER_INCH : value;
  return unit === 'kg/mm' || unit === 'kgf/mm' ? value * N_PER_KGF : value;
}
