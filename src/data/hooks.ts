/**
 * Reactive read hooks: the only way screens read data. When storage moves to
 * expo-sqlite, re-implement these (e.g. with live queries) and screens stay
 * unchanged.
 */
import { useMemo, useSyncExternalStore } from 'react';

import { applyAdjustments } from '../domain/setup';
import type { Bike, Session, SuspensionSetup } from '../domain/types';
import { useDataStore } from './zustand/store';

const byNewest = (a: Session, b: Session) =>
  b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);

/** True once persisted data has been loaded from disk. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useDataStore.persist.onFinishHydration(onChange),
    () => useDataStore.persist.hasHydrated(),
  );
}

export function useBikes(): Bike[] {
  const bikes = useDataStore((s) => s.bikes);
  return useMemo(
    () => Object.values(bikes).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [bikes],
  );
}

export function useBike(id: string | undefined): Bike | undefined {
  return useDataStore((s) => (id ? s.bikes[id] : undefined));
}

export function useActiveBikeId(): string | null {
  return useDataStore((s) => s.activeBikeId);
}

export function useActiveBike(): Bike | undefined {
  return useDataStore((s) => (s.activeBikeId ? s.bikes[s.activeBikeId] : undefined));
}

export function useSession(id: string | undefined): Session | undefined {
  return useDataStore((s) => (id ? s.sessions[id] : undefined));
}

/** Sessions for a bike, newest first. */
export function useSessionsForBike(bikeId: string | undefined): Session[] {
  const sessions = useDataStore((s) => s.sessions);
  return useMemo(
    () => (bikeId ? Object.values(sessions).filter((x) => x.bikeId === bikeId).sort(byNewest) : []),
    [sessions, bikeId],
  );
}

export function useActiveSessionForBike(bikeId: string | undefined): Session | undefined {
  const sessions = useSessionsForBike(bikeId);
  return sessions.find((s) => s.status === 'active');
}

export function useLastCompletedSession(bikeId: string | undefined): Session | undefined {
  const sessions = useSessionsForBike(bikeId);
  return sessions.find((s) => s.status === 'completed') ?? sessions[0];
}

/** Snapshot with the session's adjustments applied: the setup the rider ended on. */
export function useEffectiveSetup(session: Session | undefined): SuspensionSetup | undefined {
  return useMemo(
    () => (session ? applyAdjustments(session.snapshot.setup, session.adjustments) : undefined),
    [session],
  );
}
