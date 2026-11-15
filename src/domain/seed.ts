/**
 * First-launch seed data.
 *
 * IMPORTANT: every suspension value below is a DEMONSTRATION placeholder
 * chosen only so the UI has something to render. None of it has been checked
 * against a manufacturer manual or spec sheet, and it must not be read as a
 * stock KX250 specification. Each value carries source 'demo'.
 */
import { createAdjuster, createBike, emptySetup } from './factories';
import type { Adjuster, Value } from './types';

const demo = <T,>(value: T | null): Value<T> => ({ value, source: value === null ? 'unknown' : 'demo' });

function demoAdjuster(base: Adjuster, current: number, range: number): Adjuster {
  return { ...base, current: demo(current), range: demo(range) };
}

export function seedBikes() {
  const setup = emptySetup();

  setup.fork.hardware = { make: demo('Showa'), model: demo('Coil-spring fork') };
  setup.fork.adjusters = [
    demoAdjuster(createAdjuster({ kind: 'compression' }), 10, 20),
    demoAdjuster(createAdjuster({ kind: 'rebound' }), 10, 20),
  ];
  setup.fork.measurements = {
    springRate: demo(4.9),
    airPressure: demo<number>(null),
    forkHeight: demo(5),
    oilHeight: demo(80),
    oilVolume: demo<number>(null),
    raceSag: demo<number>(null),
  };

  setup.shock.hardware = { make: demo('Showa'), model: demo('Rear shock') };
  setup.shock.adjusters = [
    // Demo HSC is modelled in turns to show that adjusters aren't all clicks.
    demoAdjuster(createAdjuster({ kind: 'hsc', mechanism: 'turns', step: 0.25 }), 1.5, 3),
    demoAdjuster(createAdjuster({ kind: 'lsc' }), 10, 20),
    demoAdjuster(createAdjuster({ kind: 'rebound' }), 10, 20),
  ];
  setup.shock.measurements = { springRate: demo(52), raceSag: demo(105), staticSag: demo(35) };

  return [createBike({ year: 2026, make: 'Kawasaki', model: 'KX250', catalogId: 'kawasaki-kx250', suspension: setup })];
}
