import { isGlowEnabled, setGlowEnabled } from './glow';
import GUI, { type Controller } from 'lil-gui';
import * as THREE from 'three';
import './settings.css';
import type { Blob } from '@/blob/Blob';
import type { Carousel } from '@/carousel/Carousel';
import type { MaterialDef } from '@/materials/types';
import type { Effects } from '@/core/effects';
import { SHAPES, type ShapeChoice } from '@/blob/shapes';
import { describeUniforms } from '@/ui/uniformControls';

/**
 * Live tuning panel (lil-gui). The material sliders are generated from each material's named
 * uniforms, so a new material gets its controls for free. When a blend is active (see MixPanel),
 * the partner material gets its own folder too.
 */
export class SettingsPanel {
  private gui = new GUI({ title: 'Settings' });
  private materialFolders: GUI[] = [];
  private state: { speed: number; shape: ShapeChoice } = { speed: 1, shape: 'auto' };
  private melt: Controller;

  constructor(
    private blob: Blob,
    private defs: MaterialDef[],
    private carousel: Carousel,
    private extras: { effects: Effects; shape: (choice: ShapeChoice) => void },
  ) {
    this.gui.close();
    this.gui.domElement.setAttribute('aria-label', 'Live settings');

    const motion = this.gui.addFolder('Animation');
    motion.add(this.state, 'speed', 0, 3, 0.01).name('Speed').onChange((v: number) => (this.blob.speed = v));

    const shape = this.gui.addFolder('Shape');
    const options: Record<string, ShapeChoice> = { 'Auto (per material)': 'auto' };
    for (const s of SHAPES) options[s.name] = s.id;
    shape.add(this.state, 'shape', options).name('Base shape').onChange((v: ShapeChoice) => this.extras.shape(v));
    this.melt = shape.add(this.blob, 'morph', 0, 1, 0.01).name('Melt into blob').listen();
    this.blob.onShapeChanged = () => this.syncMelt();
    this.syncMelt();

    const fx = this.gui.addFolder('Effects');
    const settings = this.extras.effects.settings;
    fx.add(settings, 'bloom', 0, 1.5, 0.01).name('Bloom');
    fx.add(settings, 'bloomThreshold', 0.2, 1.5, 0.01).name('Bloom threshold');
    fx.add(settings, 'grain', 0, 0.2, 0.005).name('Grain');
    fx.add(settings, 'aberration', 0, 0.03, 0.0005).name('Chromatic aberration');
    fx.add(settings, 'dust', 0, 1, 0.01).name('Dust');
    fx.add({ glow: isGlowEnabled() }, 'glow').name('UI glow').onChange((v: boolean) => setGlowEnabled(v));
    fx.close();

    this.gui.add({ reset: () => this.reset() }, 'reset').name('Reset');

    this.blob.onMaterialsChanged = () => this.rebuildMaterialFolders();
    this.rebuildMaterialFolders();
  }

  /** The melt slider only means something on the low-poly shape. */
  private syncMelt(): void {
    this.melt.show(this.blob.shape.mode === 'polyhedron');
  }

  private reset(): void {
    this.state.speed = 1;
    this.blob.speed = 1;
    this.extras.effects.reset();
    this.state.shape = 'auto';
    this.extras.shape('auto');
    this.gui.controllersRecursive().forEach((c) => c.updateDisplay());
    // Fresh material instances bring every uniform back to its default.
    const partner = this.blob.blendWith;
    this.blob.setBlendWith(null);
    this.blob.setMaterial(this.defs[this.carousel.index]);
    this.blob.setBlendWith(partner);
  }

  private rebuildMaterialFolders(): void {
    this.materialFolders.forEach((f) => f.destroy());
    this.materialFolders = [];
    const primary = this.defs[this.carousel.index];
    this.addMaterialFolder(primary.name, this.blob.material);
    const partner = this.blob.blendMaterial;
    if (partner && this.blob.blendWith) this.addMaterialFolder(this.blob.blendWith.name, partner);
  }

  private addMaterialFolder(title: string, material: THREE.ShaderMaterial): void {
    const folder = this.gui.addFolder(title);
    this.materialFolders.push(folder);
    for (const control of describeUniforms(material.uniforms)) {
      const uniform = material.uniforms[control.name];
      if (control.kind === 'number') {
        folder.add(uniform, 'value', control.min, control.max, control.step).name(control.label);
      } else {
        // THREE.Color stores linear values: edit through an sRGB hex proxy so the picker shows what is rendered.
        const color = uniform.value as THREE.Color;
        const proxy = { value: `#${color.getHexString()}` };
        folder.addColor(proxy, 'value').name(control.label).onChange((hex: string) => color.set(hex));
      }
    }
  }
}
