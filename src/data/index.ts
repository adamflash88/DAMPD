/**
 * Data-layer entry point. Swap the implementation here (e.g. to an expo-sqlite
 * backed `Repositories`) without touching screens.
 */
import type { Repositories } from './repositories';
import { zustandRepositories } from './zustand/repositories';

export const repositories: Repositories = zustandRepositories;
export const { bikes: bikeRepository, sessions: sessionRepository } = repositories;

export * from './hooks';
export type * from './repositories';
