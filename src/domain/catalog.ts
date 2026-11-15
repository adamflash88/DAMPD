/**
 * DEMONSTRATION motorcycle catalog.
 *
 * This is a small, hand-maintained list of manufacturer and model NAMES used
 * to speed up the "Add motorcycle" flow. It is not a comprehensive database
 * and contains NO suspension specifications. A bike created from it starts
 * with an empty ("not configured") setup that the rider fills in.
 *
 * Anything not listed here can be added through manual entry.
 */

export interface CatalogModel {
  id: string; // stable, e.g. "kawasaki-kx250"
  make: string;
  model: string;
  /** Inclusive model-year span this demo entry is offered for. */
  years: [number, number];
}

const span: [number, number] = [2018, 2027];

export const CATALOG: readonly CatalogModel[] = [
  { id: 'honda-crf250r', make: 'Honda', model: 'CRF250R', years: span },
  { id: 'honda-crf450r', make: 'Honda', model: 'CRF450R', years: span },
  { id: 'kawasaki-kx250', make: 'Kawasaki', model: 'KX250', years: span },
  { id: 'kawasaki-kx450', make: 'Kawasaki', model: 'KX450', years: span },
  { id: 'ktm-125sx', make: 'KTM', model: '125 SX', years: span },
  { id: 'ktm-250sxf', make: 'KTM', model: '250 SX-F', years: span },
  { id: 'ktm-450sxf', make: 'KTM', model: '450 SX-F', years: span },
  { id: 'husqvarna-fc250', make: 'Husqvarna', model: 'FC 250', years: span },
  { id: 'husqvarna-fc450', make: 'Husqvarna', model: 'FC 450', years: span },
  { id: 'gasgas-mc250f', make: 'GASGAS', model: 'MC 250F', years: span },
  { id: 'gasgas-mc450f', make: 'GASGAS', model: 'MC 450F', years: span },
  { id: 'suzuki-rmz250', make: 'Suzuki', model: 'RM-Z250', years: span },
  { id: 'suzuki-rmz450', make: 'Suzuki', model: 'RM-Z450', years: span },
  { id: 'yamaha-yz125', make: 'Yamaha', model: 'YZ125', years: span },
  { id: 'yamaha-yz250', make: 'Yamaha', model: 'YZ250', years: span },
  { id: 'yamaha-yz250f', make: 'Yamaha', model: 'YZ250F', years: span },
  { id: 'yamaha-yz450f', make: 'Yamaha', model: 'YZ450F', years: span },
];

export function catalogYears(): number[] {
  const min = Math.min(...CATALOG.map((m) => m.years[0]));
  const max = Math.max(...CATALOG.map((m) => m.years[1]));
  const years: number[] = [];
  for (let y = max; y >= min; y--) years.push(y);
  return years;
}

export function catalogMakes(year: number): string[] {
  return [...new Set(CATALOG.filter((m) => year >= m.years[0] && year <= m.years[1]).map((m) => m.make))].sort();
}

export function catalogModels(year: number, make: string): CatalogModel[] {
  return CATALOG.filter((m) => m.make === make && year >= m.years[0] && year <= m.years[1]);
}

export function findCatalogModel(id: string | null): CatalogModel | undefined {
  return id ? CATALOG.find((m) => m.id === id) : undefined;
}

/** Case-insensitive substring filter used by searchable pickers. */
export function filterOptions<T>(items: readonly T[], query: string, text: (item: T) => string): T[] {
  const q = query.trim().toLowerCase();
  return q ? items.filter((i) => text(i).toLowerCase().includes(q)) : [...items];
}
