import { createBike, createSession } from '../../domain/factories';
import { newId, nowISO } from '../../domain/ids';
import { describeSetting, normalizeAdjusterValue, validateSetting } from '../../domain/settings';
import { applyAdjustments, deepClone, effectiveValue } from '../../domain/setup';
import { testRunsOf } from '../../domain/session';
import type { AdjustmentEvent, Bike, SavedSetup, Session, TestRunEvent } from '../../domain/types';
import type {
  BikeRepository,
  Repositories,
  RiderRepository,
  SavedSetupRepository,
  SessionRepository,
} from '../repositories';
import { getState, setState } from './store';

function requireBike(id: string): Bike {
  const bike = getState().bikes[id];
  if (!bike) throw new Error(`Bike not found: ${id}`);
  return bike;
}

function requireSession(id: string): Session {
  const session = getState().sessions[id];
  if (!session) throw new Error(`Session not found: ${id}`);
  return session;
}

function requireSaved(id: string): SavedSetup {
  const saved = getState().savedSetups[id];
  if (!saved) throw new Error(`Saved setup not found: ${id}`);
  return saved;
}

function putBike(bike: Bike): Bike {
  setState((s) => ({ bikes: { ...s.bikes, [bike.id]: bike } }));
  return bike;
}

function putSession(session: Session): Session {
  setState((s) => ({ sessions: { ...s.sessions, [session.id]: session } }));
  return session;
}

function putSaved(saved: SavedSetup): SavedSetup {
  setState((s) => ({ savedSetups: { ...s.savedSetups, [saved.id]: saved } }));
  return saved;
}

const patchBike = (id: string, patch: Partial<Bike>) => putBike({ ...requireBike(id), ...patch, updatedAt: nowISO() });
const patchSession = (id: string, patch: Partial<Session>) =>
  putSession({ ...requireSession(id), ...patch, updatedAt: nowISO() });

const bikes: BikeRepository = {
  async create(input) {
    const bike = putBike(createBike(input));
    if (!getState().activeBikeId) setState({ activeBikeId: bike.id });
    return bike;
  },
  async updateDetails(id, patch) {
    return patchBike(id, patch);
  },
  async updateUnits(id, units) {
    // Values are canonical, so changing display units never alters data.
    return patchBike(id, { units: { ...units } });
  },
  async updateSuspension(id, setup) {
    return patchBike(id, { suspension: deepClone(setup) });
  },
  async remove(id) {
    setState((s) => {
      const { [id]: _removed, ...rest } = s.bikes;
      const keep = <T extends { bikeId: string }>(r: Record<string, T>) =>
        Object.fromEntries(Object.entries(r).filter(([, x]) => x.bikeId !== id));
      const activeBikeId = s.activeBikeId === id ? (Object.keys(rest)[0] ?? null) : s.activeBikeId;
      return { bikes: rest, sessions: keep(s.sessions), savedSetups: keep(s.savedSetups), activeBikeId };
    });
  },
  async setActive(id) {
    requireBike(id);
    setState({ activeBikeId: id });
  },
};

const sessions: SessionRepository = {
  async start(bikeId, input) {
    return putSession(createSession(requireBike(bikeId), input));
  },
  async updateDetails(id, patch) {
    return patchSession(id, patch);
  },
  async updateConditions(id, conditions) {
    const s = requireSession(id);
    const event = { type: 'conditions' as const, id: newId(), at: nowISO(), conditions: { ...conditions } };
    return patchSession(id, { conditions: { ...conditions }, events: [...s.events, event] });
  },
  async addTestRun(id, input) {
    const s = requireSession(id);
    const event: TestRunEvent = {
      type: 'testRun',
      id: newId(),
      at: nowISO(),
      runNumber: testRunsOf(s).length + 1,
      outcome: input.outcome,
      symptoms: input.symptoms.map((x) => ({ ...x, situations: [...x.situations] })),
      notes: input.notes.trim(),
    };
    patchSession(id, { events: [...s.events, event] });
    return event;
  },
  async addAdjustment(id, input) {
    const s = requireSession(id);
    const current = applyAdjustments(s.snapshot.setup, s.events);
    const d = describeSetting(current, input.path);
    if (!d) throw new Error(`Setting not available on this setup: ${input.path}`);
    const after = d.adjuster ? normalizeAdjusterValue(d.adjuster, input.after) : input.after;
    const error = validateSetting(d, after, s.snapshot.units);
    if (error) throw new Error(error);
    const event: AdjustmentEvent = {
      type: 'adjustment',
      id: newId(),
      at: nowISO(),
      path: input.path,
      before: effectiveValue(s.snapshot.setup, s.events, input.path) ?? input.beforeIfUnknown ?? null,
      after,
      reason: input.reason.trim(),
    };
    patchSession(id, { events: [...s.events, event] });
    return event;
  },
  async undoLastEvent(id) {
    const s = requireSession(id);
    if (s.events.length === 0) return;
    const events = s.events.slice(0, -1);
    // Keep `conditions` consistent with the timeline if a conditions entry was undone.
    const lastConditions = [...events].reverse().find((e) => e.type === 'conditions');
    const undone = s.events[s.events.length - 1];
    const patch: Partial<Session> = { events };
    if (undone?.type === 'conditions' && lastConditions?.type === 'conditions') patch.conditions = lastConditions.conditions;
    patchSession(id, patch);
  },
  async end(id) {
    return patchSession(id, { status: 'completed', endedAt: nowISO() });
  },
  async reopen(id) {
    return patchSession(id, { status: 'active', endedAt: null });
  },
  async remove(id) {
    setState((s) => {
      const { [id]: _removed, ...rest } = s.sessions;
      return { sessions: rest };
    });
  },
};

const savedSetups: SavedSetupRepository = {
  async save(bikeId, input) {
    const bike = requireBike(bikeId);
    const now = nowISO();
    return putSaved({
      id: newId(),
      createdAt: now,
      updatedAt: now,
      bikeId,
      name: input.name.trim() || 'Untitled setup',
      notes: input.notes?.trim() ?? '',
      origin: input.sourceSessionId ? 'session' : 'user',
      sourceSessionId: input.sourceSessionId ?? null,
      units: { ...bike.units },
      setup: deepClone(input.setup ?? bike.suspension),
    });
  },
  async rename(id, name) {
    return putSaved({ ...requireSaved(id), name: name.trim() || 'Untitled setup', updatedAt: nowISO() });
  },
  async remove(id) {
    setState((s) => {
      const { [id]: _removed, ...rest } = s.savedSetups;
      return { savedSetups: rest };
    });
  },
  async restore(id) {
    const saved = requireSaved(id);
    const bike = requireBike(saved.bikeId);
    const now = nowISO();
    const previous = putSaved({
      id: newId(),
      createdAt: now,
      updatedAt: now,
      bikeId: bike.id,
      name: `Before restoring "${saved.name}"`,
      notes: '',
      origin: 'autoBeforeRestore',
      sourceSessionId: null,
      units: { ...bike.units },
      setup: deepClone(bike.suspension),
    });
    patchBike(bike.id, { suspension: deepClone(saved.setup) });
    return { previousSavedId: previous.id };
  },
};

const rider: RiderRepository = {
  async update(patch) {
    const next = { ...getState().rider, ...patch, updatedAt: nowISO() };
    setState({ rider: next });
    return next;
  },
};

export const zustandRepositories: Repositories = { bikes, sessions, savedSetups, rider };
