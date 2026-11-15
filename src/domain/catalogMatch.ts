import { CATALOG, type CatalogModel } from './catalog';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Finds the demo-catalog entry for a make/model typed by a rider, if any. */
export function findCatalogMatch(make: string, model: string): CatalogModel | undefined {
  return CATALOG.find((m) => norm(m.make) === norm(make) && norm(m.model) === norm(model));
}
