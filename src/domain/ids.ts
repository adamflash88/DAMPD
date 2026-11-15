import * as Crypto from 'expo-crypto';

import type { ISODate, ISODateTime } from './types';

/** RFC 4122 v4 UUID (expo-crypto is bundled in Expo Go). */
export function newId(): string {
  return Crypto.randomUUID();
}

export function nowISO(): ISODateTime {
  return new Date().toISOString();
}

/** Local calendar date as YYYY-MM-DD. */
export function todayISODate(date: Date = new Date()): ISODate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
