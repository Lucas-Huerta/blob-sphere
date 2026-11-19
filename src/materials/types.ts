import type * as THREE from 'three';

/** Shared resources handed to every material factory. */
export interface MaterialContext {
  envMap: THREE.CubeTexture;
}

export interface MaterialDef {
  id: string;
  name: string;
  description: string;
  /** Position in the carousel (ascending). Materials without one go last, sorted by id. */
  order?: number;
  /** Page background tint while this material is shown. */
  background: string;
  create(ctx: MaterialContext): THREE.ShaderMaterial;
}
