import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { Dust } from '@/core/dust';
import vertexShader from './finish.vert.glsl';
import fragmentShader from './finish.frag.glsl';
import highlightsShader from './highlights.frag.glsl';

/** Tunable look of the post-processing stack and the dust layer (the "Effects" folder of the settings). */
export interface EffectsSettings {
  /** Bloom strength; 0 turns the pass off. */
  bloom: number;
  /** Luminance above which the image blooms. */
  bloomThreshold: number;
  /** Film grain strength; 0 turns it off. */
  grain: number;
  /** Global chromatic aberration; 0 turns it off. */
  aberration: number;
  /** Fraction of the dust specks shown, 0..1. */
  dust: number;
}

export const DEFAULT_EFFECTS: Readonly<EffectsSettings> = {
  bloom: 0.2,
  bloomThreshold: 1,
  grain: 0.05,
  aberration: 0.006,
  dust: 0.6,
};

/**
 * Renders the scene through bloom, then grain + chromatic aberration, and owns the floating dust.
 * With every pass at 0 it falls back to a plain render, so "effects off" costs nothing.
 *
 * The canvas stays transparent (the page colour shows through): the stack works in premultiplied
 * alpha, so a glow that spills past the blob still lights the background.
 */
export class Effects {
  readonly settings: EffectsSettings = { ...DEFAULT_EFFECTS };
  readonly dust = new Dust();

  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private finish: ShaderPass;
  private highlights: ShaderPass;
  private time = 0;
  /** Temporary extra bloom (chill mode makes the blob glow as it fills). */
  bloomBoost = 0;
  /** Freezes the grain when the user prefers reduced motion. */
  animateGrain = true;

  constructor(
    private renderer: THREE.WebGLRenderer,
    private scene: THREE.Scene,
    private camera: THREE.Camera,
    coarsePointer: boolean,
  ) {
    // Antialiasing no longer comes from the canvas once we render offscreen: multisample the target.
    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: coarsePointer ? 2 : 4,
    });
    this.composer = new EffectComposer(renderer, target);
    this.composer.addPass(new RenderPass(scene, camera));
    this.highlights = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uRange: { value: 1.2 } },
      vertexShader,
      fragmentShader: highlightsShader,
    });
    this.composer.addPass(this.highlights);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), DEFAULT_EFFECTS.bloom, 0.5, DEFAULT_EFFECTS.bloomThreshold);
    this.composer.addPass(this.bloom);
    // Tone mapping + sRGB first, so grain and fringes are applied on what is displayed.
    this.composer.addPass(new OutputPass());
    this.finish = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uAberration: { value: DEFAULT_EFFECTS.aberration },
        uGrain: { value: DEFAULT_EFFECTS.grain },
        uTime: { value: 0 },
      },
      vertexShader,
      fragmentShader,
    });
    this.composer.addPass(this.finish);

    scene.add(this.dust.points);
    this.dust.amount = this.settings.dust;
  }

  resize(width: number, height: number): void {
    const ratio = this.renderer.getPixelRatio();
    this.composer.setPixelRatio(ratio);
    this.composer.setSize(width, height);
    this.dust.setPixelRatio(ratio);
  }

  render(dt: number): void {
    const s = this.settings;
    this.time += dt;
    this.dust.amount = s.dust;
    this.dust.update(dt);

    const useFinish = s.grain > 0 || s.aberration > 0;
    const bloomStrength = s.bloom + this.bloomBoost;
    if (bloomStrength <= 0 && !useFinish) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    this.bloom.enabled = this.highlights.enabled = bloomStrength > 0;
    this.bloom.strength = bloomStrength;
    this.bloom.threshold = s.bloomThreshold;
    this.finish.enabled = useFinish;
    this.finish.uniforms.uGrain.value = s.grain;
    this.finish.uniforms.uAberration.value = s.aberration;
    this.finish.uniforms.uTime.value = this.animateGrain ? this.time : 0;
    this.composer.render(dt);
  }

  reset(): void {
    Object.assign(this.settings, DEFAULT_EFFECTS);
  }

  dispose(): void {
    this.composer.dispose();
    this.dust.dispose();
  }
}
