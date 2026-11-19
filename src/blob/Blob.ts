import * as THREE from 'three';
import type { MaterialContext, MaterialDef } from '@/materials/types';

export class Blob {
  readonly mesh: THREE.Mesh;

  constructor(def: MaterialDef, private ctx: MaterialContext) {
    this.mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 64), def.create(this.ctx));
  }

  get material(): THREE.ShaderMaterial {
    return this.mesh.material as THREE.ShaderMaterial;
  }

  setMaterial(def: MaterialDef): void {
    this.material.dispose();
    this.mesh.material = def.create(this.ctx);
  }

  update(time: number): void {
    this.material.uniforms.uTime.value = time;
    this.mesh.rotation.y = time * 0.1;
  }
}
