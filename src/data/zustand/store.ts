/**
 * Zustand store persisted to AsyncStorage. Implementation detail of the data
 * layer: screens use `src/data/hooks.ts` and the repositories instead.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { emptyRiderProfile } from '../../domain/factories';
import { seedBikes } from '../../domain/seed';
import { migratePersistedState, SCHEMA_VERSION, type PersistedState } from '../migrations';

/** Unchanged from v1 so existing installs are migrated in place, not reset. */
export const STORAGE_KEY = 'dampd/state';

export function initialState(): PersistedState {
  const bikes = seedBikes();
  return {
    bikes: Object.fromEntries(bikes.map((b) => [b.id, b])),
    sessions: {},
    savedSetups: {},
    activeBikeId: bikes[0]?.id ?? null,
    rider: emptyRiderProfile(),
  };
}

export const useDataStore = create<PersistedState>()(
  persist(() => initialState(), {
    name: STORAGE_KEY,
    version: SCHEMA_VERSION,
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (s) => ({
      bikes: s.bikes,
      sessions: s.sessions,
      savedSetups: s.savedSetups,
      activeBikeId: s.activeBikeId,
      rider: s.rider,
    }),
    migrate: (persisted, version) => migratePersistedState(persisted, version),
  }),
);

export const getState = useDataStore.getState;
export const setState = useDataStore.setState;
