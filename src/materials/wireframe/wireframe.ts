import * as THREE from 'three';
import type { MaterialDef } from '../types';
import vertexShader from './wireframe.vert.glsl';
import fragmentShader from './wireframe.frag.glsl';

export const wireframe: MaterialDef = {
  id: 'wireframe',
  order: 150,
  name: 'Holo Grid',
  category: 'light',
  description: 'Neon wireframe grid with glowing nodes and a scan band sweeping through.',
  background: '#02060d',
  create: () =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.18 },
        uFrequency: { value: 0.8 },
        uLatLines: { value: 14 },
        uLonLines: { value: 28 },
        uLineWidth: { value: 1.4 },
        uGlow: { value: 1.1 },
        uScanSpeed: { value: 0.18 },
        uScanWidth: { value: 0.22 },
        uFill: { value: 0.5 },
        uImpactReact: { value: 8 },
        uLineColor: { value: new THREE.Color('#2cf0ff') },
        uScanColor: { value: new THREE.Color('#d8fbff') },
        uFillColor: { value: new THREE.Color('#0a3b5a') },
      },
    }),
};
