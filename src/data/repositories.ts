/**
 * Storage-agnostic repository contracts.
 *
 * - Commands are async so a future expo-sqlite or remote implementation can
 *   satisfy the same interface.
 * - Reactive reads go through hooks in `./hooks`. Screens never import the store.
 * - Session timelines are append-only; the only removal is undoing the most
 *   recent entry, which can't invalidate later entries.
 */
import type { NewBikeInput, StartSessionInput } from '../domain/factories';
import type {
  AdjustmentEvent,
  Bike,
  DisplayUnits,
  RiderProfile,
  RunOutcome,
  SavedSetup,
  Session,
  SettingPath,
  SuspensionSetup,
  SymptomReport,
  TestRunEvent,
  TrackConditions,
} from '../domain/types';

export type BikeDetailsPatch = Partial<Pick<Bike, 'year' | 'make' | 'model' | 'nickname' | 'catalogId'>>;

export interface BikeRepository {
  create(input: NewBikeInput): Promise<Bike>;
  updateDetails(id: string, patch: BikeDetailsPatch): Promise<Bike>;
  updateUnits(id: string, units: DisplayUnits): Promise<Bike>;
  /** Replaces the live suspension profile. Session snapshots are untouched. */
  updateSuspension(id: string, setup: SuspensionSetup): Promise<Bike>;
  /** Deletes the bike with its sessions and saved setups. */
  remove(id: string): Promise<void>;
  setActive(id: string): Promise<void>;
}

export interface NewAdjustmentInput {
  path: SettingPath;
  /** Canonical units (or adjuster units). */
  after: number;
  reason: string;
  /**
   * Only used when the previous value is unknown (nothing in the snapshot or
   * earlier adjustments). Ignored otherwise, so history can't be contradicted.
   */
  beforeIfUnknown?: number | null;
}

export interface NewTestRunInput {
  outcome: RunOutcome | null;
  symptoms: SymptomReport[];
  notes: string;
}

export type SessionDetailsPatch = Partial<Pick<Session, 'trackName' | 'date' | 'notes'>>;

export interface SessionRepository {
  /** Snapshots the bike's current setup and starts a session. */
  start(bikeId: string, input?: StartSessionInput): Promise<Session>;
  updateDetails(id: string, patch: SessionDetailsPatch): Promise<Session>;
  /** Sets current conditions and appends a conditions entry to the timeline. */
  updateConditions(id: string, conditions: TrackConditions): Promise<Session>;
  addTestRun(id: string, input: NewTestRunInput): Promise<TestRunEvent>;
  /**
   * Records a delta. `before` is derived from snapshot + earlier adjustments.
   * Rejects unknown paths and out-of-range values.
   */
  addAdjustment(id: string, input: NewAdjustmentInput): Promise<AdjustmentEvent>;
  /** Removes only the most recent timeline entry (mistake correction). */
  undoLastEvent(id: string): Promise<void>;
  end(id: string): Promise<Session>;
  reopen(id: string): Promise<Session>;
  remove(id: string): Promise<void>;
}

export interface SaveSetupInput {
  name: string;
  notes?: string;
  /** Defaults to the bike's current setup. */
  setup?: SuspensionSetup;
  sourceSessionId?: string | null;
}

export interface SavedSetupRepository {
  save(bikeId: string, input: SaveSetupInput): Promise<SavedSetup>;
  rename(id: string, name: string): Promise<SavedSetup>;
  remove(id: string): Promise<void>;
  /**
   * Makes a saved setup the bike's current setup. The previous current setup
   * is preserved first as an automatic saved setup, whose id is returned.
   */
  restore(id: string): Promise<{ previousSavedId: string }>;
}

export interface RiderRepository {
  update(patch: Partial<Omit<RiderProfile, 'updatedAt'>>): Promise<RiderProfile>;
}

export interface Repositories {
  bikes: BikeRepository;
  sessions: SessionRepository;
  savedSetups: SavedSetupRepository;
  rider: RiderRepository;
}
