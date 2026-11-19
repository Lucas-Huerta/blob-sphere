import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './plasma.vert.glsl';
import fragmentShader from './plasma.frag.glsl';

export const plasma: MaterialDef = {
  id: 'plasma',
  order: 80,
  name: 'Plasma Orb',
  category: 'light',
  description: 'Swirling energy with flickering lightning arcs and a glowing corona.',
  background: '#07041a',
  create: () =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.18 },
        uFrequency: { value: 0.9 },
        uSpeed: { value: 1 },
        uScale: { value: 1.5 },
        uArcWidth: { value: 0.06 },
        uGlow: { value: 1.2 },
        uImpactReact: { value: 8 },
        uColorA: { value: new THREE.Color('#4a14c8') },
        uColorB: { value: new THREE.Color('#3fd0ff') },
        uColorCore: { value: new THREE.Color('#f2fbff') },
      },
    }),
};
