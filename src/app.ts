import * as THREE from 'three';
import gsap from 'gsap';
import { createEnvironment } from '@/core/environment';
import { Blob } from '@/blob/Blob';
import { Carousel } from '@/carousel/Carousel';
import { bindKeyboard } from '@/input/keyboard';
import { bindSwipe } from '@/input/swipe';
import { materials } from '@/materials';
import { Hud } from '@/ui/hud';

export class App {
  private renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  private blob: Blob;
  private carousel = new Carousel(materials.length);
  private clock = new THREE.Clock();
  private timeline?: gsap.core.Timeline;
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  constructor(private container: HTMLElement) {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.blob = new Blob(materials[0], { envMap: createEnvironment(this.renderer) });
    container.appendChild(this.renderer.domElement);
    this.camera.position.set(0, 0, 4);
    this.scene.add(this.blob.mesh);
    window.addEventListener('resize', this.resize);
    this.resize();

    new Hud(document.body, materials, this.carousel);
    bindKeyboard(this.carousel);
    bindSwipe(this.renderer.domElement, this.carousel);
    this.carousel.onChange((i) => this.transitionTo(i));
    this.setBackground(0);
  }

  start(): void {
    this.renderer.setAnimationLoop(() => {
      this.blob.update(this.clock.getElapsedTime());
      this.renderer.render(this.scene, this.camera);
    });
  }

  /** Shrink the blob, swap its material, then let it spring back. */
  private transitionTo(index: number): void {
    const def = materials[index];
    this.timeline?.kill();
    this.setBackground(index);
    if (this.reducedMotion.matches) {
      this.blob.setMaterial(def);
      this.blob.mesh.scale.setScalar(1);
      return;
    }
    const scale = this.blob.mesh.scale;
    this.timeline = gsap
      .timeline()
      .to(scale, { x: 0.55, y: 0.55, z: 0.55, duration: 0.25, ease: 'power2.in' })
      .call(() => this.blob.setMaterial(def))
      .to(scale, { x: 1, y: 1, z: 1, duration: 0.9, ease: 'elastic.out(1, 0.55)' });
  }

  private setBackground(index: number): void {
    document.documentElement.style.setProperty('--bg', materials[index].background);
  }

  private resize = (): void => {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };
}
