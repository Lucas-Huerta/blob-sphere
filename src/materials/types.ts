import type * as THREE from 'three';
import type { ShapeId } from '@/blob/shapes';

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
  /** Base shape this material looks best on (used while the shape setting is on Auto). Defaults to the sphere. */
  shape?: ShapeId;
  /** Page background tint while this material is shown. */
  background: string;
  /** Optional UI glow colour; derived from `background` when omitted. */
  accent?: string;
  create(ctx: MaterialContext): THREE.ShaderMaterial;
}
