import type * as THREE from 'three';

/** Shared resources handed to every material factory. */
export interface MaterialContext {
  envMap: THREE.CubeTexture;
}

/** Thematic families from the catalogue (see CLAUDE.md). */
export type MaterialCategory = 'organic' | 'mineral' | 'light';

export const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  organic: 'Organic / soft',
  mineral: 'Mineral / solid',
  light: 'Light / abstract',
};

export interface MaterialDef {
  id: string;
  name: string;
  description: string;
  /** Position in the carousel (ascending). Materials without one go last, sorted by id. */
  order?: number;
  category: MaterialCategory;
  /** Page background tint while this material is shown. */
  background: string;
  create(ctx: MaterialContext): THREE.ShaderMaterial;
}
