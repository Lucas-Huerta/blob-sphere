import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './glass.vert.glsl';
import fragmentShader from './glass.frag.glsl';

export const glass: MaterialDef = {
  id: 'glass',
  name: 'Dispersive Glass',
  description: 'Refractive crystal splitting light into colour fringes.',
  background: '#080e16',
  create: ({ envMap }) =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.22 },
        uFrequency: { value: 0.9 },
        uEnvMap: { value: envMap },
        uTint: { value: new THREE.Color('#d8ecff') },
        uIor: { value: 1.45 },
        uDispersion: { value: 0.06 },
        uExposure: { value: 1.0 },
        uImpactReact: { value: 6 },
      },
    }),
};
