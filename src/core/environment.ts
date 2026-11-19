import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Procedural studio environment baked into a cubemap (no asset to download).
 * Shared by all reflective / refractive materials.
 */
export function createEnvironment(renderer: THREE.WebGLRenderer, size = 256): THREE.CubeTexture {
  const target = new THREE.WebGLCubeRenderTarget(size, {
    type: THREE.HalfFloatType,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
  });
  const room = new RoomEnvironment();
  new THREE.CubeCamera(0.1, 100, target).update(renderer, room);
  room.dispose();
  return target.texture;
}
