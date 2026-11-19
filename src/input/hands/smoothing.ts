/** Exponential smoothing, frame-rate independent. `halfLife` is in seconds. */
export function smoothTowards(current: number, target: number, dt: number, halfLife = 0.06): number {
  const k = 1 - Math.pow(0.5, dt / halfLife);
  return current + (target - current) * k;
}

/** One Euro filter (Casiez et al.): low jitter at rest, low lag when moving fast. */
export class OneEuroFilter {
  private x?: number;
  private dx = 0;

  constructor(
    private minCutoff = 1.4,
    private beta = 6,
    private dCutoff = 1,
  ) {}

  filter(value: number, dt: number): number {
    if (this.x === undefined || dt <= 0) {
      this.x = value;
      return value;
    }
    const rawDx = (value - this.x) / dt;
    this.dx += alpha(this.dCutoff, dt) * (rawDx - this.dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    this.x += alpha(cutoff, dt) * (value - this.x);
    return this.x;
  }

  reset(): void {
    this.x = undefined;
    this.dx = 0;
  }
}

function alpha(cutoff: number, dt: number): number {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
}
