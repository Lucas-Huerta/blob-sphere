import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './iridescent.vert.glsl';
import fragmentShader from './iridescent.frag.glsl';

export const iridescent: MaterialDef = {
  id: 'iridescent',
  name: 'Iridescent Bubble',
  description: 'Soap-bubble thin film: colours shift with angle and thickness.',
  background: '#0a0712',
  create: ({ envMap }) =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.2 },
        uFrequency: { value: 0.8 },
        uEnvMap: { value: envMap },
        uFilmIor: { value: 1.33 },
        uThicknessMin: { value: 180 },
        uThicknessMax: { value: 720 },
        uSwirlScale: { value: 1.6 },
        uIntensity: { value: 1.0 },
        uImpactReact: { value: 3 },
      },
    }),
};
