/**
 * Reactive read hooks: the only way screens read data. When storage moves to
 * expo-sqlite, re-implement these and screens stay unchanged.
 */
import { useMemo, useSyncExternalStore } from 'react';

import { applyAdjustments } from '../domain/setup';
import type { Bike, RiderProfile, SavedSetup, Session, SuspensionSetup } from '../domain/types';
import { useDataStore } from './zustand/store';

const byNewest = (a: Session, b: Session) => b.startedAt.localeCompare(a.startedAt);

/** True once persisted data has been loaded (and migrated) from disk. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useDataStore.persist.onFinishHydration(onChange),
    () => useDataStore.persist.hasHydrated(),
  );
}

export function useBikes(): Bike[] {
  const bikes = useDataStore((s) => s.bikes);
  return useMemo(() => Object.values(bikes).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [bikes]);
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

export function useRider(): RiderProfile {
  return useDataStore((s) => s.rider);
}

export function useSession(id: string | undefined): Session | undefined {
  return useDataStore((s) => (id ? s.sessions[id] : undefined));
}

/** All sessions, newest first; optionally for one bike. */
export function useSessions(bikeId?: string | null): Session[] {
  const sessions = useDataStore((s) => s.sessions);
  return useMemo(
    () => Object.values(sessions).filter((x) => !bikeId || x.bikeId === bikeId).sort(byNewest),
    [sessions, bikeId],
  );
}

export function useActiveSession(bikeId: string | undefined): Session | undefined {
  const sessions = useSessions(bikeId ?? null);
  return bikeId ? sessions.find((s) => s.status === 'active') : undefined;
}

/** Any active session across bikes (newest first). */
export function useActiveSessions(): Session[] {
  const sessions = useSessions();
  return useMemo(() => sessions.filter((s) => s.status === 'active'), [sessions]);
}

export function useRecentTracks(limit = 5): string[] {
  const sessions = useSessions();
  return useMemo(() => {
    const seen: string[] = [];
    for (const s of sessions) {
      const t = s.trackName.trim();
      if (t && !seen.includes(t)) seen.push(t);
      if (seen.length >= limit) break;
    }
    return seen;
  }, [sessions, limit]);
}

export function useSavedSetups(bikeId: string | undefined): SavedSetup[] {
  const saved = useDataStore((s) => s.savedSetups);
  return useMemo(
    () =>
      bikeId
        ? Object.values(saved)
            .filter((x) => x.bikeId === bikeId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [saved, bikeId],
  );
}

export function useSavedSetup(id: string | undefined): SavedSetup | undefined {
  return useDataStore((s) => (id ? s.savedSetups[id] : undefined));
}

/** Snapshot with the session's adjustments applied: the setup the rider is on now / ended on. */
export function useEffectiveSetup(session: Session | undefined): SuspensionSetup | undefined {
  return useMemo(() => (session ? applyAdjustments(session.snapshot.setup, session.events) : undefined), [session]);
}
