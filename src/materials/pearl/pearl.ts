import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './pearl.vert.glsl';
import fragmentShader from './pearl.frag.glsl';

export const pearl: MaterialDef = {
  id: 'pearl',
  order: 90,
  name: 'Pearl Nacre',
  category: 'mineral',
  description: 'Milky pearl with soft marbled iridescence that shifts towards the edges.',
  background: '#15121a',
  create: ({ envMap }) =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.16 },
        uFrequency: { value: 0.8 },
        uEnvMap: { value: envMap },
        uBase: { value: new THREE.Color('#f3ece4') },
        uIridescence: { value: 0.55 },
        uThickness: { value: 380 },
        uLayerScale: { value: 1.8 },
        uGloss: { value: 70 },
        uSheen: { value: 0.6 },
        uImpactReact: { value: 5 },
      },
    }),
};
