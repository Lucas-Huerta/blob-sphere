import './hud.css';
import type { Carousel } from '@/carousel/Carousel';
import { CATEGORY_LABELS, type MaterialDef } from '@/materials/types';

export class Hud {
  private title = el('h2', 'hud-title');
  private desc = el('p', 'hud-desc');
  private counter = el('span', 'hud-counter');
  private category = el('span', 'hud-category');
  private dots: HTMLButtonElement[] = [];

  constructor(
    container: HTMLElement,
    private defs: MaterialDef[],
    carousel: Carousel,
  ) {
    const root = el('div', 'hud');
    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carousel');
    root.setAttribute('aria-label', 'Materials');

    const brand = el('h1', 'hud-brand');
    brand.textContent = 'Morph';

    const prev = arrow('prev', 'Previous material', '‹', () => carousel.prev());
    const next = arrow('next', 'Next material', '›', () => carousel.next());

    const info = el('div', 'hud-info');
    info.setAttribute('aria-live', 'polite');
    const meta = el('div', 'hud-meta');
    meta.append(this.counter, this.category);
    info.append(meta, this.title, this.desc);

    const nav = el('div', 'hud-dots');
    this.dots = defs.map((d, i) => {
      const b = document.createElement('button');
      b.className = 'hud-dot';
      b.setAttribute('aria-label', `Show ${d.name}`);
      b.addEventListener('click', () => carousel.goTo(i));
      nav.append(b);
      return b;
    });

    root.append(brand, prev, next, info, nav);
    container.append(root);
    this.render(carousel.index);
    carousel.onChange((i) => this.render(i));
  }

  private render(index: number): void {
    const def = this.defs[index];
    this.title.textContent = def.name;
    this.desc.textContent = def.description;
    this.counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(this.defs.length).padStart(2, '0')}`;
    this.category.textContent = CATEGORY_LABELS[def.category];
    this.category.dataset.category = def.category;
    this.dots.forEach((d, i) => {
      d.classList.toggle('active', i === index);
      d.setAttribute('aria-current', String(i === index));
    });
    // Restart the CSS text-in animation.
    const info = this.title.parentElement!;
    info.classList.remove('swap');
    void info.offsetWidth;
    info.classList.add('swap');
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  return e;
}

function arrow(side: string, label: string, glyph: string, onClick: () => void): HTMLButtonElement {
  const b = el('button', `hud-arrow hud-arrow-${side}`);
  b.type = 'button';
  b.setAttribute('aria-label', label);
  b.textContent = glyph;
  b.addEventListener('click', onClick);
  return b;
}
