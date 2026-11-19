import './handControl.css';
import { TrackerFailure, type TrackerError } from '@/input/hands/HandTracker';

export interface HandControlActions {
  /** Starts the camera + tracking. Rejects with a TrackerFailure. */
  start(): Promise<void>;
  stop(): void;
}

interface Step {
  title: string;
  body: string;
  /** Inline SVG illustration (decorative). */
  art: string;
}

/** Open palm, 24×24 (Lucide "hand", ISC licence). */
const hand = () =>
  '<g class="stroke hand-icon"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></g>';

const blobShape = '<circle class="fill" cx="60" cy="48" r="18"/>';

const STEPS: Step[] = [
  {
    title: 'Control the blob with your hands',
    body: 'Use your webcam to touch, stretch and move the blob in mid-air. It takes three gestures — let’s walk through them. Your camera stays off until the last step.',
    art: `<svg viewBox="0 0 120 96" aria-hidden="true">${blobShape}<g transform="translate(40 14) scale(3)"><g class="art-hand">${hand()}</g></g></svg>`,
  },
  {
    title: 'Pinch to grab',
    body: 'Bring your thumb and index finger together on the blob, then move your hand: the surface sticks to your fingers and stretches. Open your fingers to let go.',
    art: `<svg viewBox="0 0 120 96" aria-hidden="true">${blobShape}<g class="art-pinch"><circle class="fill-soft" cx="60" cy="48" r="26"/><path class="stroke" d="M34 74 52 56M86 74 68 56"/><circle class="dot" cx="52" cy="56" r="3.5"/><circle class="dot" cx="68" cy="56" r="3.5"/></g></svg>`,
  },
  {
    title: 'Pinch with both hands to zoom',
    body: 'Pinch with both hands at once. Spread them apart to bring the blob closer, bring them together to push it away.',
    art: `<svg viewBox="0 0 120 96" aria-hidden="true"><g class="art-zoom">${blobShape}</g><g class="art-arrows"><path class="stroke" d="M16 48h18M24 40l-8 8 8 8M104 48H86M96 40l8 8-8 8"/></g></svg>`,
  },
  {
    title: 'Open hand to move it',
    body: 'Hold your hand open, palm to the camera. The blob follows it and leans towards where you carry it. Lower your hand and it drifts back to the centre.',
    art: `<svg viewBox="0 0 120 96" aria-hidden="true"><g class="art-follow">${blobShape}</g><g transform="translate(36 18) scale(2.8)"><g class="art-hand-move">${hand()}</g></g></svg>`,
  },
];

const ERRORS: Record<TrackerError, string> = {
  denied: 'Camera access was refused. You can allow it from your browser’s address bar and try again — the mouse and touch controls keep working in the meantime.',
  'no-camera': 'No camera was found on this device.',
  unsupported: 'Your browser does not support camera access.',
  model: 'The hand-tracking model could not be loaded. Check your connection and try again.',
};

const CAMERA_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11m0-.5V5a1.5 1.5 0 0 1 3 0v5.5m0-4a1.5 1.5 0 0 1 3 0V12m0-2.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.6-2.2L4.2 15.6a1.5 1.5 0 0 1 2.3-1.9L7 14.3"/></svg>';

/**
 * Opt-in webcam control: a button opens a step-by-step tutorial in modals,
 * ending with a consent step. The camera is requested only on explicit acceptance,
 * and its image is never displayed.
 */
export class HandControlUi {
  private button = document.createElement('button');
  private label = document.createElement('span');
  private status = document.createElement('span');
  private dialog = document.createElement('dialog');
  private step = 0;
  private busy = false;
  private error = '';
  private active = false;
  private cursor = document.createElement('div');

  constructor(
    container: HTMLElement,
    private actions: HandControlActions,
  ) {
    this.button.type = 'button';
    this.button.className = 'hc-button';
    this.button.setAttribute('aria-haspopup', 'dialog');
    this.status.className = 'hc-status';
    this.status.setAttribute('aria-live', 'polite');
    this.button.innerHTML = CAMERA_ICON;
    this.button.append(this.label, this.status);
    this.button.addEventListener('click', () => (this.active ? this.deactivate() : this.open()));

    this.dialog.className = 'hc-dialog';
    this.dialog.setAttribute('aria-labelledby', 'hc-title');
    // Esc / backdrop close; never while the camera permission prompt is pending.
    this.dialog.addEventListener('cancel', (e) => {
      if (this.busy) e.preventDefault();
    });
    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog && !this.busy) this.dialog.close();
    });

    // Small dot showing where the hand points; this is a position marker, not the camera image.
    this.cursor.className = 'hc-cursor';
    this.cursor.setAttribute('aria-hidden', 'true');
    this.cursor.hidden = true;

    container.append(this.button, this.dialog, this.cursor);
    this.renderButton();
  }

  /** Reflects how many hands the tracker currently sees (no image, just a count). */
  setHandsSeen(count: number): void {
    if (!this.active) return;
    this.status.textContent = count > 0 ? 'Hand detected' : 'Show your hand';
    this.status.dataset.seen = String(count > 0);
  }

  /** Moves the hand marker to a normalised device position, or hides it. */
  setCursor(ndc: { x: number; y: number } | null, pinching: boolean): void {
    this.cursor.hidden = !ndc || !this.active;
    if (!ndc) return;
    this.cursor.style.transform = `translate(${((ndc.x + 1) / 2) * innerWidth}px, ${((1 - ndc.y) / 2) * innerHeight}px)`;
    this.cursor.classList.toggle('pinching', pinching);
  }

  private open(): void {
    this.step = 0;
    this.error = '';
    this.renderDialog();
    this.dialog.showModal();
  }

  private deactivate(): void {
    this.actions.stop();
    this.active = false;
    this.renderButton();
  }

  /** Called when tracking ends on its own (e.g. camera permission revoked). */
  notifyStopped(): void {
    if (!this.active) return;
    this.active = false;
    this.renderButton();
  }

  private renderButton(): void {
    this.button.classList.toggle('active', this.active);
    this.label.textContent = this.active ? 'Stop camera control' : 'Control with your hands';
    this.button.setAttribute('aria-pressed', String(this.active));
    this.status.textContent = this.active ? 'Show your hand' : '';
    this.status.hidden = !this.active;
  }

  private renderDialog(): void {
    const last = this.step === STEPS.length;
    const d = this.dialog;
    d.replaceChildren();

    const card = document.createElement('div');
    card.className = 'hc-card';
    const total = STEPS.length + 1;

    const head = document.createElement('p');
    head.className = 'hc-step';
    head.textContent = `Step ${this.step + 1} of ${total}`;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'hc-close';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    close.disabled = this.busy;
    close.addEventListener('click', () => this.dialog.close());

    const body = document.createElement('div');
    body.className = 'hc-body';
    const title = document.createElement('h2');
    title.id = 'hc-title';
    title.tabIndex = -1;

    if (!last) {
      const s = STEPS[this.step];
      const art = document.createElement('div');
      art.className = 'hc-art';
      art.innerHTML = s.art;
      title.textContent = s.title;
      const p = document.createElement('p');
      p.textContent = s.body;
      body.append(art, title, p);
    } else {
      title.textContent = 'Turn on your camera?';
      const p = document.createElement('p');
      p.textContent = 'Your browser will ask for permission. You can stop at any time with the same button.';
      const legal = document.createElement('div');
      legal.className = 'hc-legal';
      legal.innerHTML =
        '<strong>Privacy notice</strong><ul>' +
        '<li>The camera image is <b>never displayed, recorded, stored or sent</b> anywhere. We keep no image or video.</li>' +
        '<li>Hand detection runs <b>entirely on your device</b>, in your browser. Only hand positions are used, in memory, and discarded immediately.</li>' +
        '<li>The camera turns off as soon as you stop, close the page or revoke the permission.</li></ul>';
      body.append(title, p, legal);
      if (this.error) {
        const err = document.createElement('p');
        err.className = 'hc-error';
        err.setAttribute('role', 'alert');
        err.textContent = this.error;
        body.append(err);
      }
    }

    const dots = document.createElement('div');
    dots.className = 'hc-dots';
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('span');
      dot.className = 'hc-dot' + (i === this.step ? ' active' : '');
      dots.append(dot);
    }

    const actions = document.createElement('div');
    actions.className = 'hc-actions';
    if (this.step > 0) actions.append(this.btn('Back', 'ghost', () => this.go(this.step - 1), this.busy));
    else actions.append(this.btn('Not now', 'ghost', () => this.dialog.close(), false));

    if (!last) {
      actions.append(this.btn('Next', 'primary', () => this.go(this.step + 1), false));
    } else {
      actions.append(
        this.btn(this.busy ? 'Starting…' : this.error ? 'Try again' : 'Accept and turn on camera', 'primary', () => void this.accept(), this.busy),
      );
    }

    card.append(close, head, body, dots, actions);
    d.append(card);
    // Move focus to the new title so screen readers announce the step.
    queueMicrotask(() => title.focus({ preventScroll: true }));
  }

  private go(step: number): void {
    this.step = step;
    this.error = '';
    this.renderDialog();
  }

  private async accept(): Promise<void> {
    this.busy = true;
    this.error = '';
    this.renderDialog();
    try {
      await this.actions.start();
      this.busy = false;
      this.active = true;
      this.renderButton();
      this.dialog.close();
      this.button.focus();
    } catch (e) {
      this.busy = false;
      this.error = ERRORS[e instanceof TrackerFailure ? e.reason : 'model'];
      this.renderDialog();
    }
  }

  private btn(text: string, kind: 'primary' | 'ghost', onClick: () => void, disabled: boolean): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `hc-btn hc-${kind}`;
    b.textContent = text;
    b.disabled = disabled;
    b.addEventListener('click', onClick);
    return b;
  }
}
