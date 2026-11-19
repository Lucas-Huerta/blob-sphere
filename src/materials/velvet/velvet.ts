import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './velvet.vert.glsl';
import fragmentShader from './velvet.frag.glsl';

export const velvet: MaterialDef = {
  id: 'velvet',
  order: 130,
  name: 'Velvet',
  category: 'organic',
  description: 'Deep cloth that glows softly at grazing angles, with brushed pile and fine grain.',
  background: '#12060a',
  create: () =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.2 },
        uFrequency: { value: 0.8 },
        uBase: { value: new THREE.Color('#7a0d2b') },
        uSheenColor: { value: new THREE.Color('#ff7596') },
        uSheenIntensity: { value: 1.2 },
        uSheenPower: { value: 2.4 },
        uSheenSharp: { value: 5 },
        uFiberScale: { value: 90 },
        uFiberStrength: { value: 0.22 },
        uPileScale: { value: 1.4 },
        uPileStrength: { value: 0.35 },
        uImpactReact: { value: 6 },
      },
    }),
};
