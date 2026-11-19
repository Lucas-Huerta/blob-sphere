import './mix.css';
import type { Blob } from '@/blob/Blob';
import type { Carousel } from '@/carousel/Carousel';
import type { MaterialDef } from '@/materials/types';

/**
 * "Mix" button + popover: pick any material of the list and blend the current one with it.
 * The slider dissolves between the two and morphs their shapes (see Blob.setBlendAmount).
 */
export class MixPanel {
  private panel = el('div', 'mix-panel');
  private button = el('button', 'mix-button');
  private slider = el('input', 'mix-slider');
  private readout = el('span', 'mix-readout');
  private items: HTMLButtonElement[] = [];
  private partner = 0;
  /** True once the user picked a partner; otherwise it follows "next in the carousel". */
  private manual = false;

  constructor(
    container: HTMLElement,
    private blob: Blob,
    private defs: MaterialDef[],
    private carousel: Carousel,
  ) {
    this.button.type = 'button';
    this.button.textContent = 'Mix';
    this.button.setAttribute('aria-expanded', 'false');
    this.button.setAttribute('aria-controls', 'mix-panel');
    this.button.addEventListener('click', () => this.toggle());

    this.panel.id = 'mix-panel';
    this.panel.hidden = true;
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-label', 'Mix two materials');

    const title = el('h3', 'mix-title');
    title.textContent = 'Mix with…';
    const list = el('div', 'mix-list');
    this.items = defs.map((d, i) => {
      const b = el('button', 'mix-item');
      b.type = 'button';
      b.textContent = d.name;
      b.addEventListener('click', () => {
        this.manual = true;
        this.setPartner(i);
      });
      list.append(b);
      return b;
    });

    const row = el('label', 'mix-row');
    const label = el('span', 'mix-label');
    label.textContent = 'Amount';
    this.slider.type = 'range';
    this.slider.min = '0';
    this.slider.max = '1';
    this.slider.step = '0.001';
    this.slider.value = '0';
    this.slider.addEventListener('input', () => {
      this.blob.setBlendAmount(Number(this.slider.value));
      this.renderAmount();
    });
    row.append(label, this.slider, this.readout);

    this.panel.append(title, list, row);
    container.append(this.button, this.panel);

    carousel.onChange(() => this.follow());
    this.follow();
    this.renderAmount();
  }

  private toggle(): void {
    this.panel.hidden = !this.panel.hidden;
    this.button.setAttribute('aria-expanded', String(!this.panel.hidden));
    this.button.classList.toggle('open', !this.panel.hidden);
  }

  private follow(): void {
    const current = this.carousel.index;
    if (!this.manual || this.partner === current) this.setPartner((current + 1) % this.defs.length);
    this.items.forEach((b, i) => (b.disabled = i === current));
  }

  private setPartner(index: number): void {
    this.partner = index;
    this.items.forEach((b, i) => {
      b.classList.toggle('active', i === index);
      b.setAttribute('aria-pressed', String(i === index));
    });
    this.blob.setBlendWith(this.defs.length > 1 ? this.defs[index] : null);
  }

  private renderAmount(): void {
    this.readout.textContent = `${Math.round(Number(this.slider.value) * 100)}%`;
    this.button.classList.toggle('mixing', Number(this.slider.value) > 0);
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  return e;
}
