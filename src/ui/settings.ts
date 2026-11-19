import GUI from 'lil-gui';
import * as THREE from 'three';
import './settings.css';
import type { Blob } from '@/blob/Blob';
import type { Carousel } from '@/carousel/Carousel';
import type { MaterialDef } from '@/materials/types';
import { describeUniforms } from '@/ui/uniformControls';

/**
 * Live tuning panel (lil-gui). The material sliders are generated from each material's named
 * uniforms, so a new material gets its controls for free. When a blend is active (see MixPanel),
 * the partner material gets its own folder too.
 */
export class SettingsPanel {
  private gui = new GUI({ title: 'Settings' });
  private materialFolders: GUI[] = [];
  private state = { speed: 1 };

  constructor(
    private blob: Blob,
    private defs: MaterialDef[],
    private carousel: Carousel,
  ) {
    this.gui.close();
    this.gui.domElement.setAttribute('aria-label', 'Live settings');

    const motion = this.gui.addFolder('Animation');
    motion.add(this.state, 'speed', 0, 3, 0.01).name('Speed').onChange((v: number) => (this.blob.speed = v));
    this.gui.add({ reset: () => this.reset() }, 'reset').name('Reset');

    this.blob.onMaterialsChanged = () => this.rebuildMaterialFolders();
    this.rebuildMaterialFolders();
  }

  private reset(): void {
    this.state.speed = 1;
    this.blob.speed = 1;
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
