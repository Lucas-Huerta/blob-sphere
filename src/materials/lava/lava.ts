import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './lava.vert.glsl';
import fragmentShader from './lava.frag.glsl';

export const lava: MaterialDef = {
  id: 'lava',
  order: 40,
  name: 'Molten Lava',
  description: 'Dark crust split by glowing, drifting cracks of magma.',
  background: '#110605',
  create: () =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.26 },
        uFrequency: { value: 0.7 },
        uScale: { value: 1.7 },
        uCrackSharpness: { value: 2.6 },
        uGlow: { value: 1.15 },
        uImpactReact: { value: 6 },
      },
    }),
};
