import { createBike, createSession } from '../../domain/factories';
import { newId, nowISO } from '../../domain/ids';
import { effectiveValue } from '../../domain/setup';
import type { Adjustment, Bike, Session } from '../../domain/types';
import type { BikeRepository, Repositories, SessionRepository } from '../repositories';
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

function putBike(bike: Bike): Bike {
  setState((s) => ({ bikes: { ...s.bikes, [bike.id]: bike } }));
  return bike;
}

function putSession(session: Session): Session {
  setState((s) => ({ sessions: { ...s.sessions, [session.id]: session } }));
  return session;
}

function patchBike(id: string, patch: Partial<Bike>): Bike {
  return putBike({ ...requireBike(id), ...patch, updatedAt: nowISO() });
}

function patchSession(id: string, patch: Partial<Session>): Session {
  return putSession({ ...requireSession(id), ...patch, updatedAt: nowISO() });
}

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
    return patchBike(id, { units: { ...units } });
  },
  async updateSuspension(id, setup) {
    return patchBike(id, { suspension: setup });
  },
  async remove(id) {
    setState((s) => {
      const { [id]: _removed, ...rest } = s.bikes;
      const sessions = Object.fromEntries(Object.entries(s.sessions).filter(([, x]) => x.bikeId !== id));
      const activeBikeId = s.activeBikeId === id ? (Object.keys(rest)[0] ?? null) : s.activeBikeId;
      return { bikes: rest, sessions, activeBikeId };
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
  async updateConditions(id, patch) {
    const s = requireSession(id);
    return patchSession(id, { conditions: { ...s.conditions, ...patch } });
  },
  async updateFeedback(id, feedback) {
    return patchSession(id, { feedback: { ...feedback, ratings: { ...feedback.ratings } } });
  },
  async addAdjustment(sessionId, input) {
    const s = requireSession(sessionId);
    const now = nowISO();
    const adjustment: Adjustment = {
      id: newId(),
      createdAt: now,
      updatedAt: now,
      setting: input.setting,
      before: effectiveValue(s.snapshot.setup, s.adjustments, input.setting),
      after: input.after,
      reason: input.reason.trim(),
    };
    patchSession(sessionId, { adjustments: [...s.adjustments, adjustment] });
    return adjustment;
  },
  async removeAdjustment(sessionId, adjustmentId) {
    const s = requireSession(sessionId);
    const remaining = s.adjustments.filter((a) => a.id !== adjustmentId);
    // Re-derive each `before` so the delta chain stays consistent after a removal.
    const rebased = remaining.map((a, i) => {
      const before = effectiveValue(s.snapshot.setup, remaining.slice(0, i), a.setting);
      return before === a.before ? a : { ...a, before, updatedAt: nowISO() };
    });
    patchSession(sessionId, { adjustments: rebased });
  },
  async complete(id) {
    return patchSession(id, { status: 'completed' });
  },
  async reopen(id) {
    return patchSession(id, { status: 'active' });
  },
  async remove(id) {
    setState((s) => {
      const { [id]: _removed, ...rest } = s.sessions;
      return { sessions: rest };
    });
  },
};

export const zustandRepositories: Repositories = { bikes, sessions };
