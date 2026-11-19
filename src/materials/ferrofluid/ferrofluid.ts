import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './ferrofluid.vert.glsl';
import fragmentShader from './ferrofluid.frag.glsl';

export const ferrofluid: MaterialDef = {
  id: 'ferrofluid',
  order: 120,
  name: 'Ferrofluid',
  category: 'mineral',
  description: 'Black magnetic liquid raising a field of glossy spikes.',
  background: '#07080b',
  create: ({ envMap }) =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.08 },
        uFrequency: { value: 0.9 },
        uEnvMap: { value: envMap },
        uBase: { value: new THREE.Color('#06070a') },
        uSheen: { value: new THREE.Color('#3b5bd9') },
        uSpikeHeight: { value: 0.3 },
        uSpikeScale: { value: 4.5 },
        uSpikeRadius: { value: 0.7 },
        uSpikeSharp: { value: 1.7 },
        uContrast: { value: 2.8 },
        uF0: { value: 0.1 },
        uExposure: { value: 1.1 },
        uTipGlow: { value: 0.35 },
      },
    }),
};
