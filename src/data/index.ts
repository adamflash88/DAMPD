/**
 * Data-layer entry point. Swap the implementation here (e.g. an expo-sqlite
 * backed `Repositories`) without touching screens.
 */
import type { Repositories } from './repositories';
import { zustandRepositories } from './zustand/repositories';

export const repositories: Repositories = zustandRepositories;
export const {
  bikes: bikeRepository,
  sessions: sessionRepository,
  savedSetups: savedSetupRepository,
  rider: riderRepository,
} = repositories;

export * from './hooks';
export type * from './repositories';
