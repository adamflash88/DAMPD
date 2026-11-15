/**
 * Storage-agnostic repository contracts.
 *
 * - Commands (create/update/delete) are async so a future expo-sqlite or remote
 *   implementation can satisfy the same interface.
 * - Reactive reads are exposed through hooks in `./hooks`, which screens use.
 *   Screens never import the store directly.
 */
import type { NewBikeInput, StartSessionInput } from '../domain/factories';
import type {
  Adjustment,
  Bike,
  BikeUnits,
  RiderFeedback,
  SettingKey,
  Session,
  SuspensionSetup,
  TrackConditions,
} from '../domain/types';

export type BikeDetailsPatch = Partial<Pick<Bike, 'year' | 'make' | 'model' | 'nickname'>>;

export interface BikeRepository {
  create(input: NewBikeInput): Promise<Bike>;
  updateDetails(id: string, patch: BikeDetailsPatch): Promise<Bike>;
  updateUnits(id: string, units: BikeUnits): Promise<Bike>;
  /** Replaces the live suspension profile. Existing session snapshots are untouched. */
  updateSuspension(id: string, setup: SuspensionSetup): Promise<Bike>;
  /** Deletes the bike and all of its sessions. */
  remove(id: string): Promise<void>;
  setActive(id: string): Promise<void>;
}

export type SessionDetailsPatch = Partial<Pick<Session, 'trackName' | 'date'>>;

export interface NewAdjustmentInput {
  setting: SettingKey;
  after: number;
  reason: string;
}

export interface SessionRepository {
  /** Snapshots the bike's current setup and starts a session. */
  start(bikeId: string, input: StartSessionInput): Promise<Session>;
  updateDetails(id: string, patch: SessionDetailsPatch): Promise<Session>;
  updateConditions(id: string, patch: Partial<TrackConditions>): Promise<Session>;
  updateFeedback(id: string, feedback: RiderFeedback): Promise<Session>;
  /** Records a delta. `before` is derived from snapshot + earlier adjustments. */
  addAdjustment(sessionId: string, input: NewAdjustmentInput): Promise<Adjustment>;
  removeAdjustment(sessionId: string, adjustmentId: string): Promise<void>;
  complete(id: string): Promise<Session>;
  reopen(id: string): Promise<Session>;
  remove(id: string): Promise<void>;
}

export interface Repositories {
  bikes: BikeRepository;
  sessions: SessionRepository;
}
