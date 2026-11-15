/**
 * DAMPD domain model (persisted schema v2).
 *
 * Pure TypeScript with no React or storage imports, so it can move unchanged
 * to expo-sqlite or a server, and be handed to future diagnostics features as
 * structured data.
 */

export type ISODateTime = string; // 2026-11-15T17:02:51.139Z
export type ISODate = string; // 2026-11-15

export interface Entity {
  id: string; // UUID v4
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// Provenance of a value. These categories are deliberately distinct:
//   manufacturer: verified against a manufacturer source. The app never assigns
//                 this on its own; nothing in the current build sets it.
//   user:         entered or explicitly confirmed by the rider. NOT manufacturer-verified.
//   demo:         illustrative demonstration value shipped with the app.
//   unknown:      no value recorded.
// ---------------------------------------------------------------------------
export type ValueSource = 'manufacturer' | 'user' | 'demo' | 'unknown';

export interface Value<T> {
  value: T | null;
  source: ValueSource;
}

// ---------------------------------------------------------------------------
// Units. Values are stored in canonical units; units below are DISPLAY prefs.
//   lengths (sag, fork height, oil height): mm
//   spring rate: N/mm
//   oil volume: cc
//   air pressure: psi
//   temperature: °C
// ---------------------------------------------------------------------------
export type LengthUnit = 'mm' | 'in';
export type SpringRateUnit = 'N/mm' | 'kgf/mm';
export type TemperatureUnit = 'C' | 'F';

export interface DisplayUnits {
  length: LengthUnit;
  springRate: SpringRateUnit;
  temperature: TemperatureUnit;
}

// ---------------------------------------------------------------------------
// Adjusters (damping clickers / screws). Each motorcycle lists only the
// adjusters it actually has. Mechanisms differ: clicks, or (fractional) turns.
// ---------------------------------------------------------------------------
export type AdjusterKind = 'compression' | 'rebound' | 'hsc' | 'lsc' | 'hsr' | 'lsr' | 'custom';
export type AdjusterMechanism = 'clicks' | 'turns';
/** How the number is counted. Values are stored in this convention. */
export type AdjusterConvention = 'outFromFullStiff' | 'inFromFullSoft';

export interface Adjuster {
  /** Stable within an end: the kind for standard adjusters, a UUID for custom ones. */
  id: string;
  kind: AdjusterKind;
  /** Display name; required for custom adjusters. */
  label: string;
  mechanism: AdjusterMechanism;
  convention: AdjusterConvention;
  /** Increment: 1 for clicks, typically 0.25 or 0.5 for turns. */
  step: number;
  current: Value<number>;
  /** Total available range in the same units (e.g. 20 clicks, 3 turns). */
  range: Value<number>;
}

export interface Modification {
  id: string;
  description: string;
  addedAt: ISODateTime;
}

export type SpringType = 'coil' | 'air';

export interface Hardware {
  make: Value<string>;
  model: Value<string>;
}

/** Numeric, canonical-unit fields of the fork. */
export interface ForkMeasurements {
  springRate: Value<number>; // N/mm
  airPressure: Value<number>; // psi (air forks)
  forkHeight: Value<number>; // mm of tube above top clamp
  oilHeight: Value<number>; // mm air gap from top of tube (NOT interchangeable with volume)
  oilVolume: Value<number>; // cc
  raceSag: Value<number>; // mm
}

export interface ShockMeasurements {
  springRate: Value<number>; // N/mm
  raceSag: Value<number>; // mm
  staticSag: Value<number>; // mm
}

export type ForkMeasurementKey = keyof ForkMeasurements;
export type ShockMeasurementKey = keyof ShockMeasurements;

export interface ForkSetup {
  hardware: Hardware;
  springType: SpringType;
  adjusters: Adjuster[];
  measurements: ForkMeasurements;
  modifications: Modification[];
}

export interface ShockSetup {
  hardware: Hardware;
  adjusters: Adjuster[];
  measurements: ShockMeasurements;
  modifications: Modification[];
}

export interface SuspensionSetup {
  fork: ForkSetup;
  shock: ShockSetup;
}

export type SuspensionEnd = keyof SuspensionSetup;

/**
 * Address of one numeric setting:
 *   "fork.adj.<adjusterId>"      e.g. fork.adj.compression, shock.adj.hsc
 *   "fork.m.<measurementKey>"    e.g. fork.m.oilHeight, shock.m.raceSag
 */
export type SettingPath = `${SuspensionEnd}.adj.${string}` | `${SuspensionEnd}.m.${string}`;

// ---------------------------------------------------------------------------
// Bike & rider
// ---------------------------------------------------------------------------

export interface Bike extends Entity {
  year: number;
  make: string;
  model: string;
  nickname: string;
  /** Catalog entry this bike was created from, if any (see domain/catalog.ts). */
  catalogId: string | null;
  units: DisplayUnits;
  suspension: SuspensionSetup;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro';

/** Rider characteristics: useful context for future diagnostics. All optional. */
export interface RiderProfile {
  name: string;
  weightKg: number | null; // canonical kg, geared rider weight
  skill: SkillLevel | null;
  notes: string;
  updatedAt: ISODateTime | null;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export type DirtType = 'loam' | 'hardPack' | 'intermediate' | 'clay' | 'sand' | 'mud' | 'mixed';
export type Moisture = 'dry' | 'tacky' | 'moist' | 'wet' | 'muddy';
export type RutLevel = 'none' | 'light' | 'moderate' | 'deep';
export type Roughness = 'smooth' | 'moderate' | 'rough' | 'veryRough';

export interface TrackConditions {
  dirtType: DirtType | null;
  moisture: Moisture | null;
  ruts: RutLevel | null;
  roughness: Roughness | null;
  temperatureC: number | null; // canonical °C
  notes: string;
}

export type SymptomType =
  | 'frontHarshness'
  | 'rearHarshness'
  | 'forkDive'
  | 'frontDeflection'
  | 'rearKicking'
  | 'packing'
  | 'bottoming'
  | 'poorCorneringTraction'
  | 'brakingInstability'
  | 'poorAccelerationTraction'
  | 'chassisMovement'
  | 'other';

export type AffectedEnd = 'front' | 'rear' | 'both';
export type Severity = 1 | 2 | 3 | 4 | 5;
export type Confidence = 'low' | 'medium' | 'high';
export type RidingSituation =
  | 'braking'
  | 'cornerEntry'
  | 'midCorner'
  | 'cornerExit'
  | 'acceleration'
  | 'jumpFaces'
  | 'landings'
  | 'whoops'
  | 'brakingBumps'
  | 'accelerationBumps'
  | 'ruts'
  | 'straights';

export interface SymptomReport {
  id: string;
  symptom: SymptomType;
  /** Required when symptom is 'other'. */
  customLabel: string;
  end: AffectedEnd;
  severity: Severity;
  situations: RidingSituation[];
  confidence: Confidence;
  notes: string;
}

export type RunOutcome = 'better' | 'worse' | 'same' | 'unsure';

interface EventBase {
  id: string;
  at: ISODateTime;
}

/** A ride on the track, with what the rider observed. */
export interface TestRunEvent extends EventBase {
  type: 'testRun';
  runNumber: number;
  /** Compared with the previous run; null when there is nothing to compare (e.g. first run). */
  outcome: RunOutcome | null;
  symptoms: SymptomReport[];
  notes: string;
}

/** One setting change, recorded as a delta against the effective setup at that moment. */
export interface AdjustmentEvent extends EventBase {
  type: 'adjustment';
  path: SettingPath;
  before: number | null;
  after: number;
  reason: string;
}

/** Track conditions changed during the day. */
export interface ConditionsEvent extends EventBase {
  type: 'conditions';
  conditions: TrackConditions;
}

export type SessionEvent = TestRunEvent | AdjustmentEvent | ConditionsEvent;

/** Immutable deep copy of the setup when the session started. */
export interface SetupSnapshot {
  capturedAt: ISODateTime;
  bikeLabel: string;
  units: DisplayUnits;
  setup: SuspensionSetup;
}

/** Ratings recorded by the v1 app; preserved verbatim, never written by v2. */
export interface LegacyFeedback {
  ratings: Record<string, number | null>;
  notes: string;
}

export interface Session extends Entity {
  bikeId: string;
  status: 'active' | 'completed';
  trackName: string;
  date: ISODate;
  startedAt: ISODateTime;
  endedAt: ISODateTime | null;
  /** Latest known conditions (history is in ConditionsEvent entries). */
  conditions: TrackConditions;
  snapshot: SetupSnapshot;
  /** Append-only, chronological timeline. */
  events: SessionEvent[];
  notes: string;
  legacyFeedback: LegacyFeedback | null;
}

// ---------------------------------------------------------------------------
// Saved setups
// ---------------------------------------------------------------------------

export type SavedSetupOrigin = 'user' | 'session' | 'autoBeforeRestore';

export interface SavedSetup extends Entity {
  bikeId: string;
  name: string;
  notes: string;
  origin: SavedSetupOrigin;
  sourceSessionId: string | null;
  units: DisplayUnits;
  setup: SuspensionSetup;
}
