import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './chrome.vert.glsl';
import fragmentShader from './chrome.frag.glsl';

export const chrome: MaterialDef = {
  id: 'chrome',
  name: 'Liquid Chrome',
  description: 'Mercury-like mirror reflecting a studio environment.',
  background: '#090a0e',
  create: ({ envMap }) =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.3 },
        uFrequency: { value: 0.9 },
        uEnvMap: { value: envMap },
        uTint: { value: new THREE.Color('#f4f7ff') },
        uDispersion: { value: 0.025 },
        uContrast: { value: 1.35 },
        uF0: { value: 0.88 },
        uImpactReact: { value: 40 },
      },
    }),
};
