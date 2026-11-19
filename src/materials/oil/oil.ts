import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './oil.vert.glsl';
import fragmentShader from './oil.frag.glsl';

export const oil: MaterialDef = {
  id: 'oil',
  order: 170,
  name: 'Oil Slick',
  category: 'light',
  description: 'Black oil with a marbled rainbow film that swirls and shifts with the angle.',
  background: '#07080c',
  create: ({ envMap }) =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.14 },
        uFrequency: { value: 0.8 },
        uEnvMap: { value: envMap },
        uBase: { value: new THREE.Color('#050507') },
        uThickness: { value: 420 },
        uThicknessVar: { value: 0.3 },
        uSwirlScale: { value: 0.75 },
        uSwirlSpeed: { value: 0.06 },
        uFilmStrength: { value: 0.6 },
        uGloss: { value: 160 },
        uImpactReact: { value: 4 },
      },
    }),
};
