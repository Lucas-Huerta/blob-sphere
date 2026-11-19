import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './holographic.vert.glsl';
import fragmentShader from './holographic.frag.glsl';

export const holographic: MaterialDef = {
  id: 'holographic',
  order: 60,
  name: 'Holographic Foil',
  description: 'Rainbow foil that shifts with the angle, with scanlines and a sweeping glitch band.',
  background: '#050a12',
  create: ({ envMap }) =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.2 },
        uFrequency: { value: 0.9 },
        uEnvMap: { value: envMap },
        uHueSpread: { value: 0.9 },
        uScanFrequency: { value: 38 },
        uScanSpeed: { value: 1.2 },
        uGrain: { value: 0.6 },
        uImpactReact: { value: 5 },
      },
    }),
};
