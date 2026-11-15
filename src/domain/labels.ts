import type {
  AffectedEnd,
  Confidence,
  DirtType,
  Moisture,
  RidingSituation,
  Roughness,
  RunOutcome,
  RutLevel,
  SkillLevel,
  SymptomType,
} from './types';

export interface Option<T extends string> {
  value: T;
  label: string;
}

export const DIRT_TYPES: readonly Option<DirtType>[] = [
  { value: 'loam', label: 'Loam' },
  { value: 'hardPack', label: 'Hard pack' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'clay', label: 'Clay' },
  { value: 'sand', label: 'Sand' },
  { value: 'mud', label: 'Mud' },
  { value: 'mixed', label: 'Mixed' },
];

export const MOISTURE_LEVELS: readonly Option<Moisture>[] = [
  { value: 'dry', label: 'Dry' },
  { value: 'tacky', label: 'Tacky' },
  { value: 'moist', label: 'Moist' },
  { value: 'wet', label: 'Wet' },
  { value: 'muddy', label: 'Muddy' },
];

export const RUT_LEVELS: readonly Option<RutLevel>[] = [
  { value: 'none', label: 'None' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'deep', label: 'Deep' },
];

export const ROUGHNESS_LEVELS: readonly Option<Roughness>[] = [
  { value: 'smooth', label: 'Smooth' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'rough', label: 'Rough' },
  { value: 'veryRough', label: 'Very rough' },
];

export const SYMPTOMS: readonly (Option<SymptomType> & { defaultEnd: AffectedEnd })[] = [
  { value: 'frontHarshness', label: 'Front-end harshness', defaultEnd: 'front' },
  { value: 'rearHarshness', label: 'Rear-end harshness', defaultEnd: 'rear' },
  { value: 'forkDive', label: 'Excessive fork dive', defaultEnd: 'front' },
  { value: 'frontDeflection', label: 'Front-end deflection', defaultEnd: 'front' },
  { value: 'rearKicking', label: 'Rear-end kicking', defaultEnd: 'rear' },
  { value: 'packing', label: 'Suspension packing', defaultEnd: 'both' },
  { value: 'bottoming', label: 'Bottoming', defaultEnd: 'both' },
  { value: 'poorCorneringTraction', label: 'Poor cornering traction', defaultEnd: 'both' },
  { value: 'brakingInstability', label: 'Instability under braking', defaultEnd: 'both' },
  { value: 'poorAccelerationTraction', label: 'Poor acceleration traction', defaultEnd: 'rear' },
  { value: 'chassisMovement', label: 'Excessive chassis movement', defaultEnd: 'both' },
  { value: 'other', label: 'Other', defaultEnd: 'both' },
];

export const AFFECTED_ENDS: readonly Option<AffectedEnd>[] = [
  { value: 'front', label: 'Front' },
  { value: 'rear', label: 'Rear' },
  { value: 'both', label: 'Both' },
];

export const CONFIDENCE_LEVELS: readonly Option<Confidence>[] = [
  { value: 'low', label: 'Not sure' },
  { value: 'medium', label: 'Fairly sure' },
  { value: 'high', label: 'Certain' },
];

export const SITUATIONS: readonly Option<RidingSituation>[] = [
  { value: 'braking', label: 'Braking' },
  { value: 'cornerEntry', label: 'Corner entry' },
  { value: 'midCorner', label: 'Mid-corner' },
  { value: 'cornerExit', label: 'Corner exit' },
  { value: 'acceleration', label: 'Acceleration' },
  { value: 'jumpFaces', label: 'Jump faces' },
  { value: 'landings', label: 'Landings' },
  { value: 'whoops', label: 'Whoops' },
  { value: 'brakingBumps', label: 'Braking bumps' },
  { value: 'accelerationBumps', label: 'Accel bumps' },
  { value: 'ruts', label: 'Ruts' },
  { value: 'straights', label: 'Straights' },
];

export const OUTCOMES: readonly Option<RunOutcome>[] = [
  { value: 'better', label: 'Better' },
  { value: 'worse', label: 'Worse' },
  { value: 'same', label: 'No difference' },
  { value: 'unsure', label: 'Unsure' },
];

export const SKILL_LEVELS: readonly Option<SkillLevel>[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'pro', label: 'Pro' },
];

export function labelFor<T extends string>(options: readonly Option<T>[], value: T | null | undefined): string | null {
  return options.find((o) => o.value === value)?.label ?? null;
}

export function symptomLabel(s: { symptom: SymptomType; customLabel: string }): string {
  return s.symptom === 'other' ? s.customLabel || 'Other' : (labelFor(SYMPTOMS, s.symptom) ?? s.symptom);
}
