import { collectMaterials } from './registry';

/**
 * Ordered registry that feeds the carousel.
 *
 * Every `<material>/<file>.ts` module is picked up automatically: to add a material, create
 * its folder and export a `MaterialDef` (set `order` to place it in the carousel). Nothing
 * here needs to change, so material branches never conflict on this file.
 */
const modules = import.meta.glob<Record<string, unknown>>(['./*/*.ts', '!./*/*.test.ts'], {
  eager: true,
});

export const materials = collectMaterials(Object.values(modules));
