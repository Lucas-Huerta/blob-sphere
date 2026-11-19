import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './gold.vert.glsl';
import fragmentShader from './gold.frag.glsl';

export const gold: MaterialDef = {
  id: 'gold',
  order: 100,
  name: 'Brushed Gold',
  category: 'mineral',
  description: 'Brushed gold metal: tinted reflections stretched along fine lathe lines.',
  background: '#16110a',
  create: ({ envMap }) =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.2 },
        uFrequency: { value: 0.9 },
        uEnvMap: { value: envMap },
        uGold: { value: new THREE.Color('#ffe29a') },
        uRoughness: { value: 0.3 },
        uBrushFreq: { value: 90 },
        uBrushStrength: { value: 0.05 },
        uAniso: { value: 0.18 },
        uContrast: { value: 1.45 },
        uExposure: { value: 1.2 },
        uImpactReact: { value: 12 },
      },
    }),
};
