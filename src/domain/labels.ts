import type { DirtType, Moisture, RatingKey, RutLevel } from './types';

export const DIRT_TYPES: readonly { value: DirtType; label: string }[] = [
  { value: 'loam', label: 'Loam' },
  { value: 'hardPack', label: 'Hard pack' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'clay', label: 'Clay' },
  { value: 'sand', label: 'Sand' },
  { value: 'mixed', label: 'Mixed' },
];

export const MOISTURE_LEVELS: readonly { value: Moisture; label: string }[] = [
  { value: 'dry', label: 'Dry' },
  { value: 'tacky', label: 'Tacky' },
  { value: 'moist', label: 'Moist' },
  { value: 'wet', label: 'Wet' },
  { value: 'muddy', label: 'Muddy' },
];

export const RUT_LEVELS: readonly { value: RutLevel; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'deep', label: 'Deep' },
];

export const RATING_KEYS: readonly { key: RatingKey; label: string; hint: string }[] = [
  { key: 'overall', label: 'Overall', hint: 'Overall feel of the bike' },
  { key: 'frontEnd', label: 'Front end', hint: 'Fork comfort and precision' },
  { key: 'rearEnd', label: 'Rear end', hint: 'Shock comfort and tracking' },
  { key: 'bottoming', label: 'Bottoming resistance', hint: '5 = never bottomed harshly' },
  { key: 'harshness', label: 'Small-bump comfort', hint: '5 = plush over chatter' },
  { key: 'cornering', label: 'Cornering', hint: 'Turn-in and holding a line' },
  { key: 'straightLineStability', label: 'Straight-line stability', hint: 'Composure at speed' },
];

export function labelFor<T extends string>(
  options: readonly { value: T; label: string }[],
  value: T | null,
): string {
  return options.find((o) => o.value === value)?.label ?? '—';
}
