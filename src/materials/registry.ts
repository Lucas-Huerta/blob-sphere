import type { MaterialDef } from './types';

const DEFAULT_ORDER = 1000;

function isMaterialDef(value: unknown): value is MaterialDef {
  const v = value as Partial<MaterialDef> | null;
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.create === 'function'
  );
}

/**
 * Gathers every MaterialDef exported by the given modules (a single def or an array of
 * defs per export), then sorts them by `order` (ties broken by id). Duplicate ids throw.
 */
export function collectMaterials(modules: Record<string, unknown>[]): MaterialDef[] {
  const found: MaterialDef[] = [];
  for (const mod of modules) {
    for (const exported of Object.values(mod)) {
      const candidates = Array.isArray(exported) ? exported : [exported];
      for (const c of candidates) if (isMaterialDef(c)) found.push(c);
    }
  }

  const ids = new Set<string>();
  for (const def of found) {
    if (ids.has(def.id)) throw new Error(`Duplicate material id: "${def.id}"`);
    ids.add(def.id);
  }

  return found.sort(
    (a, b) =>
      (a.order ?? DEFAULT_ORDER) - (b.order ?? DEFAULT_ORDER) || a.id.localeCompare(b.id),
  );
}
