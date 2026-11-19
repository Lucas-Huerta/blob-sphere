import * as THREE from 'three';
import gsap from 'gsap';
import { createEnvironment } from '@/core/environment';
import { Effects } from '@/core/effects';
import { glowColor } from '@/core/glow';
import { ChillMode } from '@/chill/ChillMode';
import { resolveShape, type ShapeChoice } from '@/blob/shapes';
import { Blob } from '@/blob/Blob';
import { Carousel } from '@/carousel/Carousel';
import { bindKeyboard } from '@/input/keyboard';
import { bindPoke } from '@/input/poke';
import { bindSwipe } from '@/input/swipe';
import { materials } from '@/materials';
import { HandController } from '@/input/hands/HandController';
import { HandTracker } from '@/input/hands/HandTracker';
import { initGlow } from '@/ui/glow';
import { Hud } from '@/ui/hud';
import { HandControlUi } from '@/ui/handControl';
import { SettingsPanel } from '@/ui/settings';
import { MixPanel } from '@/ui/mix';
import { ChillUi } from '@/ui/chill';

export class App {
  private renderer = new THREE.WebGLRenderer({
    antialias: window.devicePixelRatio < 2,
    alpha: true,
    powerPreference: 'high-performance',
  });
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  private blob: Blob;
  private carousel = new Carousel(materials.length);
  private clock = new THREE.Clock();
  private timeline?: gsap.core.Timeline;
  private tracker = new HandTracker();
  private coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  /** Camera distance that frames the whole blob; grows on narrow (portrait) screens. */
  private baseDistance = 5;
  private cameraDistance = 5;
  private cameraDistanceTarget = 5;
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private effects: Effects;
  private chill = new ChillMode();
  private chillUi: ChillUi;
  private lastTime = 0;
  private shapeChoice: ShapeChoice = 'auto';
  private shapeTimeline?: gsap.core.Timeline;

  constructor(private container: HTMLElement) {
    initGlow();
    // Phones have dense screens and weak GPUs: cap the pixel ratio lower than on desktop.
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.coarsePointer ? 1.5 : 2));
    this.blob = new Blob(materials[0], { envMap: createEnvironment(this.renderer) });
    container.appendChild(this.renderer.domElement);
    this.camera.position.set(0, 0, 5);
    this.scene.add(this.blob.mesh);
    this.effects = new Effects(this.renderer, this.scene, this.camera, this.coarsePointer);
    this.effects.animateGrain = !this.reducedMotion.matches;
    window.addEventListener('resize', this.resize);
    this.resize();
    this.cameraDistance = this.cameraDistanceTarget;
    this.camera.position.z = this.cameraDistance;

    new Hud(document.body, materials, this.carousel);
    new SettingsPanel(this.blob, materials, this.carousel, {
      effects: this.effects,
      shape: (choice) => {
        this.shapeChoice = choice;
        this.applyShape();
      },
    });
    new MixPanel(document.body, this.blob, materials, this.carousel);
    this.chillUi = new ChillUi(document.body, this.chill);
    this.setupHands();
    bindKeyboard(this.carousel);
    // Registered first so `grabbed` is already up to date when the swipe handler reads it.
    const poke = bindPoke(this.renderer.domElement, {
      poke: (ndc, strength) => this.blob.pokeAt(ndc, this.camera, strength),
      grab: (ndc) => this.blob.grab(ndc, this.camera),
      release: () => this.blob.releaseGrab(),
    });
    bindSwipe(this.renderer.domElement, this.carousel, () => poke.grabbed);
    this.blob.motionScale = this.reducedMotion.matches ? 0.3 : 1;
    this.reducedMotion.addEventListener('change', (e) => {
      this.blob.motionScale = e.matches ? 0.3 : 1;
      this.effects.animateGrain = !e.matches;
    });
    this.carousel.onChange((i) => this.transitionTo(i));
    this.setBackground(0);
  }

  start(): void {
    this.renderer.setAnimationLoop(() => {
      const time = this.clock.getElapsedTime();
      // Clamped so a hidden tab does not fast-forward the breathing guide on return.
      const dt = Math.min(time - this.lastTime, 0.1);
      this.lastTime = time;

      // Chill mode: the body swells with the breath and everything else slows down.
      this.chill.update(dt);
      this.chillUi.update();
      const calm = this.chill.calm;
      this.blob.breath = this.chill.level;
      this.blob.tempo = 1 - 0.55 * calm;
      this.effects.dust.speed = 1 - 0.6 * calm;
      this.effects.bloomBoost = 0.3 * this.chill.level;

      this.blob.update(time);
      this.cameraDistance += (this.cameraDistanceTarget - this.cameraDistance) * 0.12;
      this.camera.position.z = this.cameraDistance;
      this.effects.render(dt);
    });
  }

  /** Optional webcam control: a button opens the tutorial, camera only starts after consent. */
  private setupHands(): void {
    const ui = new HandControlUi(document.body, {
      start: () => this.tracker.start(),
      stop: () => this.stopHands(),
    });
    const controller = new HandController(
      {
        pinchStart: (ndc) => {
          const hit = this.blob.pokeAt(ndc, this.camera, 1);
          if (hit) this.blob.grab(ndc, this.camera);
          return hit;
        },
        pinchMove: (ndc) => this.blob.grab(ndc, this.camera),
        pinchEnd: () => this.blob.releaseGrab(),
        openHand: (ndc) => this.blob.carryTo(ndc),
        zoom: (factor) => (this.cameraDistanceTarget = this.baseDistance * factor),
        handsSeen: (n) => ui.setHandsSeen(n),
        cursor: (ndc, pinching) => ui.setCursor(ndc, pinching),
      },
      () => this.camera.aspect,
    );
    this.handController = controller;
    this.tracker.onStop(() => ui.notifyStopped());
    this.tracker.onFrame((hands, dt) => controller.update(hands, dt));
  }

  private handController?: HandController;

  private stopHands(): void {
    this.tracker.stop();
    this.handController?.reset();
    this.cameraDistanceTarget = this.baseDistance;
  }

  /** Spin the blob one full turn in the navigation direction, swapping the material mid-turn. */
  private transitionTo(index: number): void {
    const def = materials[index];
    this.timeline?.kill();
    this.setBackground(index);
    this.applyShape();
    if (this.reducedMotion.matches) {
      this.blob.setMaterial(def);
      return;
    }
    // "next" sweeps the front surface to the left, "prev" to the right.
    const spinTo = this.blob.spin - this.carousel.direction * Math.PI * 2;
    this.timeline = gsap
      .timeline()
      .to(this.blob, { spin: spinTo, duration: 0.7, ease: 'power3.inOut' }, 0)
      .call(() => this.blob.setMaterial(def), undefined, 0.3);
  }

  /**
   * Show the shape asked for (a fixed choice, or the current material's preference on Auto):
   * the body pops out, the geometry is swapped, and it pops back in. The low-poly shape starts
   * as a blob and crystallises into its icosahedron.
   */
  private applyShape(): void {
    const id = resolveShape(this.shapeChoice, materials[this.carousel.index].shape);
    if (id === this.blob.shape.id && !this.shapeTimeline?.isActive()) return;
    this.shapeTimeline?.kill();
    const swap = (): void => {
      this.blob.setShape(id);
      this.blob.morph = id === 'lowpoly' && this.reducedMotion.matches ? 0 : 1;
    };
    if (this.reducedMotion.matches) {
      this.blob.shapeScale = 1;
      swap();
      return;
    }
    const timeline = gsap.timeline();
    timeline
      .to(this.blob, { shapeScale: 0.02, duration: 0.22, ease: 'power2.in' })
      .call(swap)
      .to(this.blob, { shapeScale: 1, duration: 0.8, ease: 'back.out(1.5)' });
    if (id === 'lowpoly') timeline.to(this.blob, { morph: 0, duration: 2.4, ease: 'power2.inOut' }, '<0.25');
    this.shapeTimeline = timeline;
  }

  private setBackground(index: number): void {
    document.documentElement.style.setProperty('--bg', materials[index].background);
    document.documentElement.style.setProperty('--glow', glowColor(materials[index].background, materials[index].accent));
    this.effects.dust.setTintFrom(materials[index].background);
  }

  private resize = (): void => {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.renderer.setSize(w, h);
    this.effects.resize(w, h);
    const aspect = w / h;
    this.camera.aspect = aspect;

    // Keep the blob fully visible: widen the framing when the screen is narrower than the blob needs.
    const fovTan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const minVisibleWidth = 3.4;
    const wasAtBase = Math.abs(this.cameraDistanceTarget - this.baseDistance) < 1e-3;
    this.baseDistance = Math.max(5, minVisibleWidth / (2 * fovTan * aspect));
    if (wasAtBase) this.cameraDistanceTarget = this.baseDistance;

    // In portrait the title/description sit under the blob: shift the view so it rides a bit higher.
    const lift = aspect < 0.8 ? h * 0.07 : 0;
    this.camera.setViewOffset(w, h, 0, lift, w, h);
    this.camera.updateProjectionMatrix();
  };
}
