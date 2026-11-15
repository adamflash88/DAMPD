/**
 * Zustand store persisted to AsyncStorage. This file is an implementation
 * detail of the data layer: screens go through `src/data/hooks.ts` and the
 * repositories instead.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { seedBikes } from '../../domain/seed';
import { migratePersistedState, SCHEMA_VERSION, type PersistedState } from '../migrations';

export const STORAGE_KEY = 'dampd/state';

export function initialState(): PersistedState {
  const bikes = seedBikes();
  return {
    bikes: Object.fromEntries(bikes.map((b) => [b.id, b])),
    sessions: {},
    activeBikeId: bikes[0]?.id ?? null,
  };
}

export const useDataStore = create<PersistedState>()(
  persist(() => initialState(), {
    name: STORAGE_KEY,
    version: SCHEMA_VERSION,
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (s) => ({ bikes: s.bikes, sessions: s.sessions, activeBikeId: s.activeBikeId }),
    migrate: (persisted, version) => migratePersistedState(persisted, version),
  }),
);

export const getState = useDataStore.getState;
export const setState = useDataStore.setState;
