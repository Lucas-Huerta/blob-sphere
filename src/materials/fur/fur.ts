import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './fur.vert.glsl';
import fragmentShader from './fur.frag.glsl';

export const fur: MaterialDef = {
  id: 'fur',
  order: 180,
  name: 'Fur',
  category: 'organic',
  description: 'Soft dense fur: thousands of strands that sway in the wind and fuzz the silhouette.',
  background: '#1a1411',
  create: () =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.1 },
        uFrequency: { value: 0.7 },
        uLength: { value: 0.12 },
        uDensity: { value: 42 },
        uThickness: { value: 0.4 },
        uSway: { value: 0.08 },
        uClump: { value: 0.16 },
        uVariation: { value: 0.35 },
        uSheen: { value: 0.6 },
        uRoot: { value: new THREE.Color('#5a3216') },
        uTip: { value: new THREE.Color('#e0a15a') },
        uImpactReact: { value: 2 },
      },
    }),
};
