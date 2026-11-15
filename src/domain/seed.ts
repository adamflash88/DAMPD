/**
 * First-launch seed data.
 *
 * IMPORTANT: every suspension value below is an ILLUSTRATIVE PLACEHOLDER chosen
 * only so the UI has something to render. None of it has been checked against
 * a manufacturer manual or spec sheet, and it must not be read as a stock
 * KX250 specification. Each value carries `isVerified: false`, so the app shows
 * an "Illustrative" badge until the rider edits or confirms it.
 */
import { createBike, DEFAULT_UNITS } from './factories';
import type { Bike, Spec } from './types';

/** Seed value that has NOT been verified. */
const illustrative = <T,>(value: T | null): Spec<T> => ({ value, isVerified: false });

export function seedBikes(): Bike[] {
  const kx250 = createBike({
    year: 2026,
    make: 'Kawasaki',
    model: 'KX250',
    nickname: '',
    units: { ...DEFAULT_UNITS },
    suspension: {
      fork: {
        make: illustrative('Showa'),
        model: illustrative('Coil-spring fork'),
        modifications: [],
        settings: {
          springRate: illustrative(4.9),
          compression: illustrative(10),
          rebound: illustrative(10),
          forkHeight: illustrative(5),
          oilLevel: illustrative(80),
          raceSag: illustrative<number>(null),
        },
        clickerRanges: {
          compression: illustrative(20),
          rebound: illustrative(20),
        },
      },
      shock: {
        make: illustrative('Showa'),
        model: illustrative('Rear shock'),
        modifications: [],
        settings: {
          springRate: illustrative(52),
          highSpeedCompression: illustrative(2),
          lowSpeedCompression: illustrative(10),
          rebound: illustrative(10),
          raceSag: illustrative(105),
          staticSag: illustrative(35),
        },
        clickerRanges: {
          highSpeedCompression: illustrative(4),
          lowSpeedCompression: illustrative(20),
          rebound: illustrative(20),
        },
      },
    },
  });
  return [kx250];
}
