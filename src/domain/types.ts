/**
 * Core domain types. Pure TypeScript with no React and no storage concerns, so
 * these can move unchanged to an expo-sqlite (or server) backend later.
 */

export type ISODateTime = string; // e.g. 2026-11-15T17:02:51.139Z
export type ISODate = string; // e.g. 2026-11-15

export interface Entity {
  id: string; // UUID v4
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/**
 * A value that may come from seed/illustrative data. `isVerified` stays false
 * until the rider edits or explicitly confirms it; the UI shows an
 * "Illustrative" badge for any unverified value.
 */
export interface Spec<T> {
  value: T | null;
  isVerified: boolean;
}

// ---------------------------------------------------------------------------
// Units & conventions (stored per bike so they can change later)
// ---------------------------------------------------------------------------

export type SagUnit = 'mm' | 'in';
export type SpringRateUnit = 'N/mm' | 'kg/mm';
export type LengthUnit = 'mm';
export type OilLevelUnit = 'mm' | 'cc';
export type TemperatureUnit = 'C' | 'F';
export type ClickerConvention = 'clicksOutFromFullStiff' | 'clicksInFromFullSoft';

export interface BikeUnits {
  sag: SagUnit;
  springRate: SpringRateUnit;
  length: LengthUnit;
  oilLevel: OilLevelUnit;
  temperature: TemperatureUnit;
  clickerConvention: ClickerConvention;
}

// ---------------------------------------------------------------------------
// Suspension setup
// ---------------------------------------------------------------------------

export type ForkSettingKey =
  | 'springRate'
  | 'compression'
  | 'rebound'
  | 'forkHeight'
  | 'oilLevel'
  | 'raceSag';
export type ForkClickerKey = 'compression' | 'rebound';

export type ShockSettingKey =
  | 'springRate'
  | 'highSpeedCompression'
  | 'lowSpeedCompression'
  | 'rebound'
  | 'raceSag'
  | 'staticSag';
export type ShockClickerKey = 'highSpeedCompression' | 'lowSpeedCompression' | 'rebound';

export interface SuspensionEnd<K extends string, C extends K> {
  make: Spec<string>;
  model: Spec<string>;
  /** Free-text list, e.g. "Revalved mid-valve", "Stiffer springs". */
  modifications: string[];
  /** Numeric settings. Clickers are stored using the bike's clicker convention. */
  settings: Record<K, Spec<number>>;
  /** Total available clicks per adjuster (the range), e.g. 0…max. */
  clickerRanges: Record<C, Spec<number>>;
}

export type ForkSetup = SuspensionEnd<ForkSettingKey, ForkClickerKey>;
export type ShockSetup = SuspensionEnd<ShockSettingKey, ShockClickerKey>;

export interface SuspensionSetup {
  fork: ForkSetup;
  shock: ShockSetup;
}

export type SuspensionEndId = keyof SuspensionSetup;

/** Fully qualified key of a numeric setting, e.g. "shock.lowSpeedCompression". */
export type SettingKey = `fork.${ForkSettingKey}` | `shock.${ShockSettingKey}`;

// ---------------------------------------------------------------------------
// Bike
// ---------------------------------------------------------------------------

export interface Bike extends Entity {
  year: number;
  make: string;
  model: string;
  nickname: string;
  units: BikeUnits;
  suspension: SuspensionSetup;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export type DirtType = 'loam' | 'hardPack' | 'sand' | 'clay' | 'intermediate' | 'mixed';
export type Moisture = 'dry' | 'tacky' | 'moist' | 'wet' | 'muddy';
export type RutLevel = 'none' | 'light' | 'moderate' | 'deep';

export interface TrackConditions {
  dirtType: DirtType | null;
  moisture: Moisture | null;
  ruts: RutLevel | null;
  /** Air temperature in the unit captured in the session snapshot. */
  temperature: number | null;
}

export type RatingKey =
  | 'overall'
  | 'frontEnd'
  | 'rearEnd'
  | 'bottoming'
  | 'harshness'
  | 'cornering'
  | 'straightLineStability';

/** 1 (poor) … 5 (excellent); null = not rated. */
export type Rating = 1 | 2 | 3 | 4 | 5;

export interface RiderFeedback {
  ratings: Record<RatingKey, Rating | null>;
  notes: string;
}

/**
 * Immutable copy of the full setup and units at session start. Sessions never
 * reference the live bike profile, so editing the profile can't rewrite history.
 */
export interface SetupSnapshot {
  capturedAt: ISODateTime;
  bikeLabel: string;
  units: BikeUnits;
  setup: SuspensionSetup;
}

/** A change made during the session, recorded as a delta against the snapshot. */
export interface Adjustment extends Entity {
  setting: SettingKey;
  before: number | null;
  after: number;
  reason: string;
}

export type SessionStatus = 'active' | 'completed';

export interface Session extends Entity {
  bikeId: string;
  status: SessionStatus;
  trackName: string;
  date: ISODate;
  conditions: TrackConditions;
  feedback: RiderFeedback;
  snapshot: SetupSnapshot;
  /** Chronological. Effective setup = snapshot + adjustments applied in order. */
  adjustments: Adjustment[];
}
