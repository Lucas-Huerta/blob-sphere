import './chill.css';
import type { ChillMode } from '@/chill/ChillMode';
import type { BreathPhaseId } from '@/chill/breathing';

const PHASE_LABEL: Record<BreathPhaseId, string> = { inhale: 'Inhale', hold: 'Hold', exhale: 'Exhale' };
const PHASE_HINT: Record<BreathPhaseId, string> = {
  inhale: 'Slowly, through your nose',
  hold: 'Stay still, let go of the tension',
  exhale: 'Long and slow, through your mouth',
};
const RING_RADIUS = 46;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * Chill mode UI: a toggle button, and while it runs a focus overlay with the 4-7-8 guide.
 * The rest of the interface fades out through the `chill-mode` class on <body> (see chill.css).
 */
export class ChillUi {
  private button = el('button', 'chill-button');
  private guide = el('div', 'chill-guide');
  private count = el('span', 'chill-count');
  private phase = el('p', 'chill-phase');
  private hint = el('p', 'chill-hint');
  private arc: SVGCircleElement;
  /** Screen-reader announcement, updated once per phase (not every second). */
  private live = el('div', 'chill-live');
  private shownPhase: BreathPhaseId | null = null;
  private shownCount = -1;

  constructor(
    container: HTMLElement,
    private chill: ChillMode,
  ) {
    this.button.type = 'button';
    this.button.setAttribute('aria-pressed', 'false');
    this.button.setAttribute('aria-controls', 'chill-guide');
    this.button.addEventListener('click', () => chill.toggle());

    this.guide.id = 'chill-guide';
    this.guide.setAttribute('aria-label', '4-7-8 breathing guide');
    this.guide.hidden = true;

    const ring = el('div', 'chill-ring');
    ring.setAttribute('aria-hidden', 'true');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    const track = circle('chill-track');
    this.arc = circle('chill-arc');
    this.arc.style.strokeDasharray = String(RING_LENGTH);
    svg.append(track, this.arc);
    ring.append(svg, this.count);
    this.hint.setAttribute('aria-hidden', 'true');
    this.guide.append(ring, this.phase, this.hint);

    this.live.setAttribute('role', 'status');
    this.live.setAttribute('aria-live', 'polite');

    container.append(this.button, this.guide, this.live);

    chill.onChange((on) => this.render(on));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && chill.active) chill.active = false;
    });
    this.render(chill.active);
  }

  private render(on: boolean): void {
    document.body.classList.toggle('chill-mode', on);
    this.button.setAttribute('aria-pressed', String(on));
    this.button.textContent = on ? 'Exit chill' : 'Chill';
    this.button.setAttribute('aria-label', on ? 'Exit chill mode' : 'Start chill mode: guided 4-7-8 breathing');
    this.guide.hidden = !on;
    this.shownPhase = null;
    this.shownCount = -1;
    if (!on) this.live.textContent = 'Chill mode ended';
    else this.update();
  }

  /** Refresh the guide; cheap enough to call every frame. */
  update(): void {
    if (!this.chill.active) return;
    const { phase, remaining, progress } = this.chill.state;
    if (phase !== this.shownPhase) {
      this.shownPhase = phase;
      this.phase.textContent = PHASE_LABEL[phase];
      this.hint.textContent = PHASE_HINT[phase];
      this.guide.dataset.phase = phase;
      this.live.textContent = `${PHASE_LABEL[phase]}. ${PHASE_HINT[phase]}`;
    }
    const seconds = Math.ceil(remaining);
    if (seconds !== this.shownCount) {
      this.shownCount = seconds;
      this.count.textContent = String(seconds);
    }
    this.arc.style.strokeDashoffset = String(RING_LENGTH * progress);
  }
}

function circle(cls: string): SVGCircleElement {
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('class', cls);
  c.setAttribute('cx', '50');
  c.setAttribute('cy', '50');
  c.setAttribute('r', String(RING_RADIUS));
  return c;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  return e;
}
