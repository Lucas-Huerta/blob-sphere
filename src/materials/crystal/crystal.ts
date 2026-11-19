import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './crystal.vert.glsl';
import fragmentShader from './crystal.frag.glsl';

export const crystal: MaterialDef = {
  id: 'crystal',
  order: 160,
  name: 'Faceted Crystal',
  category: 'mineral',
  shape: 'lowpoly',
  description: 'Cut gemstone: flat facets that bend light, sparkle and meet in bright edges.',
  background: '#0d0818',
  create: ({ envMap }) =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.12 },
        uFrequency: { value: 0.8 },
        uEnvMap: { value: envMap },
        uGemColor: { value: new THREE.Color('#b98cff') },
        uDeepColor: { value: new THREE.Color('#5a1fc0') },
        uFacets: { value: 2.3 },
        uFlatness: { value: 1 },
        uIor: { value: 1.9 },
        uDispersion: { value: 0.07 },
        uAbsorption: { value: 1.8 },
        uBrilliance: { value: 0.9 },
        uEdge: { value: 0.022 },
        uSparkle: { value: 1.2 },
        uImpactReact: { value: 8 },
      },
    }),
};
