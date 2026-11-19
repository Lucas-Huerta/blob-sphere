import { breathAt, type BreathState } from '@/chill/breathing';

type Listener = (active: boolean) => void;

/**
 * Chill / focus mode state: while active it follows the 4-7-8 breath; when it ends the lungs
 * empty smoothly instead of snapping. No DOM here, so it stays easy to reason about.
 */
export class ChillMode {
  private _active = false;
  private startedAt = 0;
  private clock = 0;
  private _level = 0;
  private _calm = 0;
  private _state: BreathState = breathAt(0);
  private listeners = new Set<Listener>();

  get active(): boolean {
    return this._active;
  }

  /** Smoothed lung fill, 0..1 (what the body swells with). */
  get level(): number {
    return this._level;
  }

  /** 0..1, eased in while active: how much the scene has settled down. */
  get calm(): number {
    return this._calm;
  }

  /** Breath state of the running session (frozen on the last one once stopped). */
  get state(): BreathState {
    return this._state;
  }

  set active(on: boolean) {
    if (on === this._active) return;
    this._active = on;
    if (on) this.startedAt = this.clock;
    this.listeners.forEach((fn) => fn(on));
  }

  toggle(): void {
    this.active = !this._active;
  }

  onChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Advance by `dt` seconds. */
  update(dt: number): void {
    this.clock += dt;
    if (this._active) this._state = breathAt(this.clock - this.startedAt);
    const target = this._active ? this._state.fill : 0;
    // Follow the breath tightly while running; ease out gently on stop.
    const rate = this._active ? 12 : 2.5;
    this._level += (target - this._level) * (1 - Math.exp(-dt * rate));
    this._calm += ((this._active ? 1 : 0) - this._calm) * (1 - Math.exp(-dt * 1.5));
  }
}
