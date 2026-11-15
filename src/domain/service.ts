/**
 * Suspension service records: groundwork for professional tuner support.
 *
 * Not surfaced in the UI yet and not persisted. Records separate
 * customer-visible information from technician-private information, and
 * `toRiderView` is the ONLY way rider-facing code should read a record, so
 * proprietary technician data (valving stacks, internal specs, private notes)
 * can never leak into the rider app by accident.
 */
import type { ISODate, ISODateTime, SuspensionEnd } from './types';

export interface Technician {
  id: string;
  name: string;
  business: string;
}

export type ServiceType = 'service' | 'revalve' | 'springChange' | 'rebuild' | 'inspection' | 'other';

/** Visible to the rider. */
export interface ServiceRecordPublic {
  serviceType: ServiceType;
  ends: SuspensionEnd[];
  serviceDate: ISODate;
  summary: string;
  /** Spring changes the rider needs to know about, canonical N/mm. */
  springChanges: { end: SuspensionEnd; fromNPerMm: number | null; toNPerMm: number }[];
  /** Notes the technician chose to share with the rider. */
  customerNotes: string;
  recommendedNextServiceHours: number | null;
}

/** Technician-only. Never rendered in the rider app. */
export interface ServiceRecordPrivate {
  valvingNotes: string;
  internalSpecs: Record<string, string>;
  technicianNotes: string;
}

export interface ServiceRecord {
  id: string;
  bikeId: string;
  technician: Technician;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  public: ServiceRecordPublic;
  private: ServiceRecordPrivate;
}

export type RiderServiceView = Omit<ServiceRecord, 'private'>;

/** Strips technician-private fields. Use for every rider-facing read. */
export function toRiderView(record: ServiceRecord): RiderServiceView {
  const { private: _private, ...rest } = record;
  return JSON.parse(JSON.stringify(rest)) as RiderServiceView;
}
