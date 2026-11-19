import './hud.css';
import type { Carousel } from '@/carousel/Carousel';
import { CATEGORY_LABELS, type MaterialDef } from '@/materials/types';

export class Hud {
  private title = el('h2', 'hud-title');
  private desc = el('p', 'hud-desc');
  private counter = el('span', 'hud-counter');
  private category = el('span', 'hud-category');
  private ticks: SVGGElement[] = [];
  private wheel!: SVGGElement;

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

    const nav = this.buildDial(carousel);

    root.append(brand, prev, next, info, nav);
    container.append(root);
    this.render(carousel.index);
    carousel.onChange((i) => this.render(i));
  }

  /**
   * Half-circle dial: ticks sit on a wheel that rotates so the active material is always at the top.
   * Tap a tick, drag / swipe sideways or scroll to move through the carousel.
   */
  private buildDial(carousel: Carousel): HTMLElement {
    const nav = el('div', 'hud-dots hud-dial');
    nav.setAttribute('role', 'group');
    nav.setAttribute('aria-label', 'Material dial');

    const svg = svgEl('svg');
    svg.setAttribute('viewBox', `0 0 ${DIAL.w} ${DIAL.h}`);
    svg.setAttribute('aria-hidden', 'true');
    const clip = svgEl('clipPath');
    clip.id = 'hud-dial-clip';
    const rect = svgEl('rect');
    rect.setAttribute('width', String(DIAL.w));
    rect.setAttribute('height', String(DIAL.cy + 2));
    clip.append(rect);
    const outer = svgEl('g');
    outer.setAttribute('clip-path', 'url(#hud-dial-clip)');
    this.wheel = svgEl('g');
    this.wheel.setAttribute('class', 'dial-wheel');

    this.ticks = this.defs.map((_, i) => {
      const a = ((90 - i * DIAL.step) * Math.PI) / 180;
      const g = svgEl('g');
      g.setAttribute('class', 'dial-tick');
      g.dataset.i = String(i);
      g.append(
        radial(a, DIAL.r - 6, DIAL.r, 'dial-base'),
        radial(a, DIAL.r - 16, DIAL.r - 6, 'dial-ext'),
        radial(a, DIAL.r - 16, DIAL.r, 'dial-hit'),
      );
      this.wheel.append(g);
      return g;
    });
    outer.append(this.wheel);
    svg.append(clip, outer);
    nav.append(svg);

    // Tap a tick to jump to it.
    let suppressClick = false;
    nav.addEventListener('click', (e) => {
      if (suppressClick) return;
      const tick = (e.target as Element).closest<SVGGElement>('.dial-tick');
      if (tick) carousel.goTo(Number(tick.dataset.i));
    });

    // Drag / swipe: one tick step per arc length travelled at the tick radius.
    let pointerId: number | null = null;
    let startX = 0;
    let lastX = 0;
    let acc = 0;
    let dragging = false;
    const stepPx = () =>
      (svg.getBoundingClientRect().width / DIAL.w) * DIAL.r * ((DIAL.step * Math.PI) / 180);
    nav.addEventListener('pointerdown', (e) => {
      pointerId = e.pointerId;
      startX = lastX = e.clientX;
      acc = 0;
      dragging = false;
    });
    nav.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pointerId) return;
      if (!dragging && Math.abs(e.clientX - startX) > 6) {
        dragging = true;
        nav.setPointerCapture(e.pointerId);
        nav.classList.add('dragging');
      }
      if (!dragging) return;
      acc += e.clientX - lastX;
      lastX = e.clientX;
      const step = stepPx();
      while (acc <= -step) {
        carousel.next();
        acc += step;
      }
      while (acc >= step) {
        carousel.prev();
        acc -= step;
      }
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      nav.classList.remove('dragging');
      if (dragging) {
        suppressClick = true;
        setTimeout(() => (suppressClick = false), 0);
      }
      dragging = false;
    };
    nav.addEventListener('pointerup', end);
    nav.addEventListener('pointercancel', end);

    // Trackpad / wheel scroll.
    let wheelAcc = 0;
    nav.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        wheelAcc += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (Math.abs(wheelAcc) < 40) return;
        if (wheelAcc > 0) carousel.next();
        else carousel.prev();
        wheelAcc = 0;
      },
      { passive: false },
    );
    return nav;
  }

  private render(index: number): void {
    const def = this.defs[index];
    this.title.textContent = def.name;
    this.desc.textContent = def.description;
    this.counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(this.defs.length).padStart(2, '0')}`;
    this.category.textContent = CATEGORY_LABELS[def.category];
    this.category.dataset.category = def.category;
    this.wheel.style.transform = `rotate(${-index * DIAL.step}deg)`;
    this.ticks.forEach((t, i) => {
      const active = i === index;
      t.classList.toggle('active', active);
      t.style.opacity = active ? '1' : String(Math.max(0.06, 0.55 - Math.abs(i - index) * 0.07));
    });
    // Restart the CSS text-in animation.
    const info = this.title.parentElement!;
    info.classList.remove('swap');
    void info.offsetWidth;
    info.classList.add('swap');
  }
}

/** Dial geometry in viewBox units (centre at the bottom, ticks on the upper half). */
const DIAL = { w: 300, h: 160, cx: 150, cy: 150, r: 120, step: 8 } as const;

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

function radial(angle: number, r1: number, r2: number, cls: string): SVGLineElement {
  const l = svgEl('line');
  l.setAttribute('class', cls);
  l.setAttribute('x1', (DIAL.cx + r1 * Math.cos(angle)).toFixed(2));
  l.setAttribute('y1', (DIAL.cy - r1 * Math.sin(angle)).toFixed(2));
  l.setAttribute('x2', (DIAL.cx + r2 * Math.cos(angle)).toFixed(2));
  l.setAttribute('y2', (DIAL.cy - r2 * Math.sin(angle)).toFixed(2));
  return l;
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
