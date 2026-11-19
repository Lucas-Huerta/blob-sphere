import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './jelly.vert.glsl';
import fragmentShader from './jelly.frag.glsl';

export const jelly: MaterialDef = {
  id: 'jelly',
  order: 50,
  name: 'Wobbly Jelly',
  category: 'organic',
  description: 'Translucent gelatin: light bleeds through thin parts, deep colour in the core.',
  background: '#14060c',
  create: ({ envMap }) =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.22 },
        uFrequency: { value: 0.8 },
        uEnvMap: { value: envMap },
        uColorLight: { value: new THREE.Color('#ff7a9c') },
        uColorDeep: { value: new THREE.Color('#9a0a3a') },
        uAbsorption: { value: 2.4 },
        uWrap: { value: 0.6 },
        uTransmission: { value: 0.8 },
        uGloss: { value: 90 },
        uImpactReact: { value: 8 },
      },
    }),
};
