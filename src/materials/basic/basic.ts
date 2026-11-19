import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './basic.vert.glsl';
import fragmentShader from './basic.frag.glsl';

interface Variant {
  id: string;
  order: number;
  name: string;
  description: string;
  background: string;
  color: string;
  amplitude: number;
  frequency: number;
}

function makeBasic(v: Variant): MaterialDef {
  return {
    id: v.id,
    order: v.order,
    name: v.name,
    description: v.description,
    background: v.background,
    create: () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uAmplitude: { value: v.amplitude },
          uFrequency: { value: v.frequency },
          uColor: { value: new THREE.Color(v.color) },
          uImpactReact: { value: 4 },
        },
      }),
  };
}

/** Placeholder materials, to be replaced by real shaders (chrome, glass, ...). */
export const basicVariants: MaterialDef[] = [
  makeBasic({ id: 'basic-indigo', order: 900, name: 'Indigo', description: 'Placeholder: diffuse + fresnel.', background: '#0b0b14', color: '#5b6cff', amplitude: 0.25, frequency: 1.2 }),
  makeBasic({ id: 'basic-ember', order: 901, name: 'Ember', description: 'Placeholder: warm, high-frequency ripples.', background: '#140a08', color: '#ff6a3d', amplitude: 0.18, frequency: 2.2 }),
  makeBasic({ id: 'basic-mint', order: 902, name: 'Mint', description: 'Placeholder: calm, slow undulation.', background: '#07130f', color: '#3dffb0', amplitude: 0.32, frequency: 0.8 }),
];
