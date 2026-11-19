import * as THREE from 'three';
import vertexShader from './dust.vert.glsl';
import fragmentShader from './dust.frag.glsl';

const COUNT = 900;
/** Volume the specks float in, centred slightly behind the blob so some pass in front of it. */
const BOX = new THREE.Vector3(15, 9, 10);
const CENTER = new THREE.Vector3(0, 0, -0.5);

/** Floating dust: soft additive specks drifting around the blob, for depth. */
export class Dust {
  readonly points: THREE.Points;
  private material: THREE.ShaderMaterial;
  private time = 0;
  private tint = new THREE.Color('#cfd6ff');
  private tintTarget = new THREE.Color('#cfd6ff');
  /** Drift speed multiplier (chill mode slows it down). */
  speed = 1;

  constructor() {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * BOX.x;
      positions[i * 3 + 1] = (Math.random() - 0.5) * BOX.y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * BOX.z;
      for (let k = 0; k < 4; k++) seeds[i * 4 + k] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    // The vertex shader moves the specks: the real bounds are the box, not the raw positions.
    geometry.boundingSphere = new THREE.Sphere(CENTER.clone(), BOX.length());

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 1 },
        uPixelRatio: { value: 1 },
        uAmount: { value: 0.6 },
        uBox: { value: BOX },
        uCenter: { value: CENTER },
        uColor: { value: this.tint },
        uOpacity: { value: 0.55 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geometry, this.material);
    this.points.frustumCulled = false;
  }

  /** Fraction of the specks shown, 0..1 (0 hides the layer entirely). */
  set amount(value: number) {
    this.material.uniforms.uAmount.value = value;
    this.points.visible = value > 0;
  }

  setPixelRatio(ratio: number): void {
    this.material.uniforms.uPixelRatio.value = ratio;
  }

  /** Tint the dust after the page background: a pale version of its hue. */
  setTintFrom(background: string): void {
    const hsl = { h: 0, s: 0, l: 0 };
    new THREE.Color(background).getHSL(hsl);
    this.tintTarget.setHSL(hsl.h, Math.min(0.6, hsl.s + 0.2), 0.78);
  }

  update(dt: number): void {
    this.time += dt * this.speed;
    this.material.uniforms.uTime.value = this.time;
    this.tint.lerp(this.tintTarget, 1 - Math.exp(-dt * 2));
  }

  dispose(): void {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}
