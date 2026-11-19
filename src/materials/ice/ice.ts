import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './ice.vert.glsl';
import fragmentShader from './ice.frag.glsl';

export const ice: MaterialDef = {
  id: 'ice',
  order: 110,
  name: 'Frosted Ice',
  category: 'mineral',
  description: 'Blue ice under patchy frost: blurred refraction, inner cracks and glints.',
  background: '#0a1220',
  create: ({ envMap }) =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.2 },
        uFrequency: { value: 0.8 },
        uEnvMap: { value: envMap },
        uIceColor: { value: new THREE.Color('#c4ecff') },
        uDeepColor: { value: new THREE.Color('#3f94dc') },
        uFrostColor: { value: new THREE.Color('#eef8ff') },
        uIor: { value: 1.31 },
        uAbsorption: { value: 2.2 },
        uFrostScale: { value: 9 },
        uFrostBump: { value: 0.35 },
        uFrostBlur: { value: 0.75 },
        uFrostAmount: { value: 0.55 },
        uCracks: { value: 0.6 },
        uImpactReact: { value: 8 },
      },
    }),
};
