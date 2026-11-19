import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './aurora.vert.glsl';
import fragmentShader from './aurora.frag.glsl';

export const aurora: MaterialDef = {
  id: 'aurora',
  order: 140,
  name: 'Aurora',
  category: 'light',
  description: 'Drifting green, cyan and violet curtains with a softly glowing edge.',
  background: '#040712',
  create: () =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.18 },
        uFrequency: { value: 0.8 },
        uSpeed: { value: 1 },
        uScale: { value: 1.6 },
        uStretch: { value: 0.3 },
        uIntensity: { value: 1.3 },
        uRim: { value: 0.9 },
        uImpactReact: { value: 6 },
        uColorBase: { value: new THREE.Color('#060b22') },
        uColorA: { value: new THREE.Color('#2cff9a') },
        uColorB: { value: new THREE.Color('#2fb8ff') },
        uColorC: { value: new THREE.Color('#b04bff') },
      },
    }),
};
