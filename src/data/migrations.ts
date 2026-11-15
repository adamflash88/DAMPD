/**
 * Versioned persisted schema + migration hook.
 *
 * To change the persisted shape:
 *  1. Bump SCHEMA_VERSION.
 *  2. Add a migration keyed by the version it upgrades FROM.
 *  3. Add a test in __tests__/migrations.test.ts.
 */
import type { Bike, Session } from '../domain/types';

export const SCHEMA_VERSION = 1;

export interface PersistedStateV1 {
  bikes: Record<string, Bike>;
  sessions: Record<string, Session>;
  activeBikeId: string | null;
}

export type PersistedState = PersistedStateV1;

type Migration = (state: unknown) => unknown;

/** migrations[n] upgrades a state persisted at version n to version n + 1. */
export const migrations: Record<number, Migration> = {
  // 1: (s) => ({ ...(s as PersistedStateV1), newField: defaultValue }),
};

export function migratePersistedState(persisted: unknown, fromVersion: number): PersistedState {
  if (fromVersion > SCHEMA_VERSION) {
    // Data written by a newer app build. Don't guess; keep it as-is.
    return persisted as PersistedState;
  }
  let state = persisted;
  for (let v = fromVersion; v < SCHEMA_VERSION; v++) {
    const step = migrations[v];
    if (!step) throw new Error(`Missing migration from schema v${v} to v${v + 1}`);
    state = step(state);
  }
  return state as PersistedState;
}
