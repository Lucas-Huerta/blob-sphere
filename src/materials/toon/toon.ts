import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './toon.vert.glsl';
import fragmentShader from './toon.frag.glsl';

export const toon: MaterialDef = {
  id: 'toon',
  order: 70,
  name: 'Toon Cel',
  category: 'light',
  description: 'Flat cartoon tones, halftone shadows, hard highlight and an ink outline.',
  background: '#141c33',
  create: () =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.22 },
        uFrequency: { value: 0.9 },
        uShadow: { value: new THREE.Color('#3a2f9e') },
        uMid: { value: new THREE.Color('#5a7dff') },
        uLight: { value: new THREE.Color('#a8dcff') },
        uInk: { value: new THREE.Color('#0b0f2a') },
        uOutline: { value: 0.2 },
        uHalftone: { value: 1.0 },
        uImpactReact: { value: 6 },
      },
    }),
};
